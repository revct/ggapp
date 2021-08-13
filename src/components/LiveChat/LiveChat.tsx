import React from 'react';
import {
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  BackHandler,
  Alert,
} from 'react-native';
import Modal from 'react-native-modal';
import WebView from 'react-native-webview';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import Spinner from 'components/Spinner/Spinner';
import Text from 'components/Text/Text';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import colors from 'configs/colors';
import {LiveChatProps, LiveChatState} from './interfaces';
import {
  WebViewNavigationEvent,
  WebViewErrorEvent,
  WebViewNavigation,
} from 'react-native-webview/lib/WebViewTypes';
import {rgba} from 'utils/Misc';
import {LIVE_CHAT_URL} from 'configs/app';
import {withLiveChat} from 'contexts/LiveChatContext';

class LiveChat extends React.Component<LiveChatProps, LiveChatState> {
  static webviewInitialState = {
    url: null,
    status: 'No Page Loaded',
    backButtonEnabled: false,
    forwardButtonEnabled: false,
    loading: true,
    messageFromWebView: null,
    navigationType: null,
    description: '',
  };

  state: LiveChatState = {
    isReady: false,
    isFetching: false,
    errorMessge: null,
    webview: {...LiveChat.webviewInitialState},
    checkoutUrl: null,
    initializationError: null,
    showModal: false,
    initialUrl: null,
  };

  backPress?: any;

  webview: WebView | null = null;

  mounted: boolean = false;

  constructor(props: LiveChatProps) {
    super(props);
  }

  componentDidMount() {
    // set mounted to true
    this.mounted = true;
  }

  componentWillUnmount() {
    // set component to unmounted
    this.mounted = false;
    // remove back press event handler
    if (this.backPress) {
      this.backPress.remove();
    }
  }

  handleBackPress = () => {
    if (this.mounted) {
      this.handleGoBack();
      return true;
    }
    return false;
  };

  initialize = () => {
    this.setState(({initialUrl}) => ({
      isReady: true,
      errorMessge: null,
      webview: {...LiveChat.webviewInitialState},
      initialUrl: !initialUrl ? LIVE_CHAT_URL : initialUrl,
    }));
  };

  handleGoBack = () => {
    const {isReady} = this.state;
    // go back if not yet ready
    if (!isReady) {
      return this.dismiss();
    }
    // ask the user to confirm action
    Alert.alert(
      'Close Live Chat',
      'Are you sure you want to close the live chat?',
      [
        {text: 'No'},
        {text: 'Yes, Close', onPress: this.dismiss, style: 'destructive'},
      ],
    );
  };

  handleShow = () => {
    // ask user to confirm when choosing to go back
    this.backPress = BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackPress,
    );
    // initialize view
    setTimeout(this.initialize, 200);
  };

  handleDismiss = () => {
    // remove back press event handler
    if (this.backPress) {
      this.backPress.remove();
    }
  };

  handleReload = () => {
    if (!this.webview) {
      return;
    }
    this.webview.reload();
  };

  handleCanel = () => {
    if (!this.webview) {
      return;
    }
    this.webview.stopLoading();
  };

  dismiss = () => {
    const {liveChat} = this.props;
    liveChat.dismiss();
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
      () => {},
    );
  };

  render() {
    const {show} = this.props;
    return (
      <Modal
        style={styles.modal}
        isVisible={show}
        animationIn="fadeInUp"
        animationInTiming={300}
        animationOut="fadeOutDown"
        animationOutTiming={300}
        hardwareAccelerated={true}
        onBackButtonPress={this.handleGoBack}
        backdropOpacity={0.6}
        onBackdropPress={this.handleGoBack}
        onModalShow={this.handleShow}
        onModalHide={this.handleDismiss}>
        <View style={styles.modalContent}>
          <View style={styles.modalContentInner}>
            {this.renderWebviewControls()}
            {this.renderWebview()}
          </View>
        </View>
      </Modal>
    );
  }

  renderWebviewControls() {
    const {initialUrl, webview} = this.state;
    if (!initialUrl) {
      return null;
    }
    return (
      <View style={styles.navbar}>
        <TouchableWithoutFeedback onPress={this.handleGoBack}>
          <View style={styles.buttonContainer}>
            <VectorIcon name="md-arrow-down" color={colors.accent} size={22} />
          </View>
        </TouchableWithoutFeedback>
        <Text numberOfLines={1} bold style={styles.webpageAddress}>
          {(!__DEV__ && webview.url) || ''}
        </Text>
        {webview && webview.loading ? (
          <TouchableWithoutFeedback onPress={this.handleCanel}>
            <View style={styles.buttonContainer}>
              <VectorIcon name="md-close" color={colors.accent} size={22} />
            </View>
          </TouchableWithoutFeedback>
        ) : (
          <TouchableWithoutFeedback onPress={this.handleReload}>
            <View style={styles.buttonContainer}>
              <VectorIcon name="md-refresh" color={colors.accent} size={22} />
            </View>
          </TouchableWithoutFeedback>
        )}
      </View>
    );
  }

  renderWebview() {
    const {initialUrl} = this.state;
    if (!initialUrl) {
      return null;
    }
    return (
      <View style={styles.webviewContainer}>
        <View style={styles.webviewBgSpinner}>
          <Spinner />
        </View>
        <WebView
          ref={ref => (this.webview = ref)}
          source={{uri: initialUrl}}
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
      </View>
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
  webviewBgSpinner: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'pink',
  },
  webviewContainer: {
    flex: 1,
  },
  webpageAddress: {
    flex: 1,
    textAlign: 'left',
    paddingHorizontal: 8,
    color: colors.gray500,
    fontSize: 14,
  },
  buttonContainer: {
    height: 56,
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navbar: {
    height: 56,
    alignItems: 'center',
    flexDirection: 'row',
  },
  modalContentInner: {
    flex: 1,
    backgroundColor: colors.white,
    paddingBottom: getStatusBarHeight(true) > 20 ? 32 : 0,
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  modal: {
    flex: 1,
    margin: 0,
    paddingTop: getStatusBarHeight(true) + 56,
  },
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
    backgroundColor: colors.white,
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

export default withLiveChat(LiveChat);
