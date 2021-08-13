import React from 'react';
import {
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  BackHandler,
  Alert,
} from 'react-native';
import Spinner from 'components/Spinner/Spinner';
import Text from 'components/Text/Text';
import Screen from 'components/Screen/Screen';
import WebView from 'react-native-webview';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import colors from 'configs/colors';
import {NavigationStackScreenProps} from 'react-navigation-stack';
import {NavigationParams} from 'react-navigation';
import {
  MonnifyPaymentProps,
  MonnifyPaymentState,
  MonnifyPaymentInfo,
} from './interfaces';
import Toast from 'utils/Toast';
import {
  WebViewNavigationEvent,
  WebViewErrorEvent,
  WebViewNavigation,
} from 'react-native-webview/lib/WebViewTypes';
import {rgba} from 'utils/Misc';
import InitializePayment from 'api/InitializePayment';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import Logger from 'utils/Logger';

class MonnifyPayment extends React.Component<
  MonnifyPaymentProps,
  MonnifyPaymentState
> {
  static navigationOptions = (
    props: NavigationStackScreenProps<NavigationParams>,
  ) => {
    const {state} = props.navigation;
    return {
      headerTitle: state.params ? state.params.headerTitle : 'Payment',
      headerTintColor: colors.gray600,
      headerTitleContainerStyle: styles.headerContainer,
      headerTransparent: true,
      headerStyle: styles.header,
      headerTitleStyle: styles.headerTitle,
      headerBackTitle: ' ',
    };
  };

  static webviewInitialState = {
    url: null,
    status: 'No Page Loaded',
    backButtonEnabled: false,
    forwardButtonEnabled: false,
    loading: false,
    messageFromWebView: null,
    navigationType: null,
    description: '',
  };

  state: MonnifyPaymentState = {
    isReady: false,
    isFetching: false,
    errorMessge: null,
    webview: {...MonnifyPayment.webviewInitialState},
    checkoutUrl: null,
    initializationError: null,
  };

  backPress?: any;

  webview: WebView | null = null;

  paymentInitializer: InitializePayment;

  constructor(props: MonnifyPaymentProps) {
    super(props);
    this.paymentInitializer = new InitializePayment();
  }

  componentDidMount() {
    const {navigation} = this.props;
    // ask user to confirm when choosing to go back
    this.backPress = BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackPress,
    );
    // go back if initial url is not set
    if (!this.getPaymentInfo()) {
      // show an alert message
      Toast.alert('Please provide a payment reference to continue.');
      // fo back to previous screen
      return navigation.goBack();
    }
    // initialize view
    setTimeout(() => this.initialize(), 200);
  }

  componentWillUnmount() {
    // remove back press event handler
    if (this.backPress) {
      this.backPress.remove();
    }
  }

  handleBackPress = () => {
    this.handleGoBack();
    return true;
  };

  getPaymentInfo(): MonnifyPaymentInfo {
    return this.props.navigation.getParam('paymentInfo');
  }

  getRedirectValidation() {
    return this.props.navigation.getParam('redirectValidation');
  }

  getPaymentCompleteCallback() {
    return this.props.navigation.getParam('onPaymentComplete');
  }

  getPaymentInitializedCallback(): (url: string) => void {
    return this.props.navigation.getParam('onPaymentInitialized');
  }

  initialize = () => {
    this.setState(
      {
        isReady: true,
        errorMessge: null,
        webview: {...MonnifyPayment.webviewInitialState},
      },
      this.initializePayment,
    );
  };

  initializePayment = () => {
    this.setState(
      {
        isFetching: true,
      },
      async () => {
        const paymentInfo = this.getPaymentInfo();
        // get a new checkout url
        try {
          // create a new payment
          const newPayment = await this.paymentInitializer.fetch(paymentInfo);
          // fire initialized callback
          const initializeCallback = this.getPaymentInitializedCallback();
          if (initializeCallback) {
            initializeCallback(newPayment.checkoutUrl);
          }
          // update component state with checkout url
          this.setState({
            isFetching: false,
            checkoutUrl: newPayment.checkoutUrl,
          });
        } catch (e) {
          let errorMessage = e.message;
          if (e.response && e.response.data) {
            errorMessage = e.response.data.responseMessage || errorMessage;
          }
          if (/network/gi.test(errorMessage)) {
            errorMessage =
              'Please check your internet connection and try again.';
          }
          // log error
          Logger(e);
          this.setState({
            isFetching: false,
            errorMessge: errorMessage,
          });
        }
      },
    );
  };

  isComplete(url: string | null) {
    const {navigation} = this.props;
    const redirectValidation = this.getRedirectValidation();
    const paymentCompleteCallback = this.getPaymentCompleteCallback();
    // check if expected route params where not provided
    if (
      typeof redirectValidation !== 'function' ||
      typeof paymentCompleteCallback !== 'function'
    ) {
      Toast.alert('Some required arguments where not provided.');
      return navigation.goBack();
    }

    // regex passed failed
    if (redirectValidation(url)) {
      // fire callback passing the url
      paymentCompleteCallback(url);
      // go to previous page
      navigation.goBack();
    }
  }

  handleGoBack = () => {
    const {isReady} = this.state;
    const {navigation} = this.props;

    // go back if not yet ready
    if (!isReady) {
      return navigation.goBack();
    }

    // ask the user to confirm action
    Alert.alert(
      'Attention',
      'You are about to leave this page,' + 'are you sure you want to go back?',
      [{text: 'No'}, {text: 'Yes, Go back', onPress: navigation.goBack}],
    );
  };

  handleWebStateChange = (
    event: WebViewNavigationEvent | WebViewErrorEvent | WebViewNavigation,
  ) => {
    const {webview} = this.state;
    // update webview in component state
    this.setState(
      {
        webview: {
          ...webview,
          backButtonEnabled: event.canGoBack,
          forwardButtonEnabled: event.canGoForward,
          url: event.url,
          status: event.title,
          loading: event.loading,
          description: event.description,
        },
      },
      () => this.isComplete(this.state.webview.url),
    );
  };

  render() {
    const {isReady, isFetching} = this.state;
    return (
      <Screen>
        <View style={styles.container}>
          {/* main content */}
          {isReady ? this.renderWebview() : null}
          {isReady ? this.renderHttpError() : null}
        </View>

        {/* show when loading activity is ongoing */}
        {!isReady || isFetching ? (
          <View style={styles.overlayLoader}>
            <Spinner />
          </View>
        ) : null}
      </Screen>
    );
  }

  renderWebview() {
    const {checkoutUrl} = this.state;
    if (!checkoutUrl) {
      return null;
    }
    return (
      <WebView
        ref={ref => (this.webview = ref)}
        source={{uri: checkoutUrl}}
        javaScriptEnabled={true}
        geolocationEnabled={false}
        scalesPageToFit={true}
        onNavigationStateChange={this.handleWebStateChange}
        style={styles.webview}
        renderLoading={this.renderLoader}
        startInLoadingState={true}
        renderError={this.renderWebviewError}
        onLoadEnd={this.handleWebStateChange}
      />
    );
  }

  renderWebviewError = () => {
    const {description} = this.state.webview;
    return (
      <View style={styles.webviewError}>
        <Text style={styles.webviewErrorBody}>
          {description
            ? description
            : 'An error occured while loading the webpage.'}
        </Text>
        {this.webview ? (
          <TouchableWithoutFeedback onPress={this.webview.reload}>
            <View>
              <Text style={{color: colors.accent}}>Reload</Text>
            </View>
          </TouchableWithoutFeedback>
        ) : null}
      </View>
    );
  };

  renderHttpError() {
    const {isFetching, errorMessge} = this.state;

    // don't load if there's no error
    if (!errorMessge || isFetching) {
      return;
    }

    return (
      <View style={styles.httpError}>
        <VectorIcon name="md-alert" color={colors.accent} size={40} />
        <Text style={styles.httpErrorText}>An Error Occured</Text>
        <Text style={styles.httpErrorBody}>{errorMessge}</Text>
        {/* retry button */}
        <TouchableWithoutFeedback onPress={this.initialize}>
          <View>
            <Text style={{color: colors.accent}}>Try Again</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }

  renderLoader() {
    return (
      <View style={styles.webviewLoader}>
        <Spinner />
        <Text style={styles.loaderLabel}>Loading...</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  overlayLoader: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: rgba(colors.white, 0.7),
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingTop: getStatusBarHeight(true) + 56,
  },
  webview: {
    flex: 1,
  },
  webviewLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255,255,255,1)',
  },
  loaderLabel: {
    textAlign: 'center',
    marginTop: 4,
  },
  webviewError: {
    position: 'absolute',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255,255,255,1)',
  },
  webviewErrorTitle: {
    marginTop: 16,
  },
  webviewErrorBody: {
    marginBottom: 16,
  },
  httpError: {
    position: 'absolute',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255,255,255,1)',
    paddingHorizontal: 56,
  },
  httpErrorTitle: {
    marginTop: 16,
  },
  httpErrorBody: {
    marginBottom: 24,
    marginTop: 16,
    textAlign: 'center',
  },
  loader: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255,255,255,1)',
  },
  headerContainer: {},
  header: {},
  headerTitle: {
    color: colors.black,
    fontWeight: '400',
    textAlign: 'center',
    alignSelf: 'center',
    flex: 1,
  },
});

export default MonnifyPayment;
