import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableWithoutFeedback} from 'react-native';
import Screen from 'components/Screen/Screen';
import WebView from 'react-native-webview';
import {getStatusBarHeight} from 'react-native-status-bar-height';
import {rgba} from 'utils/Misc';
import colors from 'configs/colors';
import VectorIcon from 'components/VectorIcon/VectorIcon';
import Spinner from 'components/Spinner/Spinner';
import { redirectUrl } from 'configs/loyalty';
import UrlHelper from 'utils/UrlHelper';


const MonnifyPointTopupPayment = ({navigation}) => {
  const [isReady, setIsReady] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessge, setErrorMessge] = useState(null)
  const url = navigation.getParam("url");
  const [checkoutUrl, setCheckoutUrl] = useState(url)
  const [hasVerified, setHasVerified] = useState(false)
  
  useEffect(() => {
    initialize()
  }, [])

  const initialize = () => {
    setIsReady(true)
  }
  
  const renderHttpError = () => {
    // don't load if there's no error
    if (!errorMessge || isFetching) {
      return;
    }

    return (
      <View style={styles.httpError}>
        <VectorIcon name="md-alert" color={colors.accent} size={40} />
        <Text style={{}}>An Error Occured</Text>
        <Text style={styles.httpErrorBody}>{errorMessge}</Text>
        {/* retry button */}
        <TouchableWithoutFeedback onPress={initialize}>
          <View>
            <Text style={{color: colors.accent}}>Try Again</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }


  const redirectValidation = (url: string): any => {
    const urlHelper = new UrlHelper(url);
    return urlHelper.get('paymentReference', null);
  };

  const handleWebStateChange = e => {
    const {url} = e;
    //check if it has redirected back to redirecURL
    if(url && url.includes(redirectUrl) && !hasVerified)
    {
      const paymentReference = redirectValidation(url)
      //redirect to verify with param paymentReference
      setHasVerified(true)
      navigation.navigate('VerifyPointTopup',{
        paymentReference
      });
    }else{
      return;
    };
  }

const renderLoader = () => {
  return (
    <View style={styles.webviewLoader}>
      <Spinner />
      <Text style={styles.loaderLabel}>Loading...</Text>
    </View>
  );
}
  const renderWebview = () => {
    if (!checkoutUrl) {
      return null;
    }
    return (
      <WebView
        // ref={ref => (this.webview = ref)}
        source={{uri: checkoutUrl}}
        javaScriptEnabled={true}
        geolocationEnabled={false}
        scalesPageToFit={true}
        onNavigationStateChange={handleWebStateChange}
        style={styles.webview}
        renderLoading={renderLoader}
        startInLoadingState={true}
        // renderError={this.renderWebviewError}
        onLoadEnd={handleWebStateChange}
      />
    );
  }

  return (
    <Screen>
      <View style={styles.container}>
        {/* main content */}
        {isReady ?renderWebview() : null}
        {isReady ?renderHttpError() : null}
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

const styles = StyleSheet.create({
  headerContainer: {},
  header: {},
  headerTitle: {
    color: colors.black,
    textAlign: 'center',
    alignSelf: 'center',
    fontSize: 18,
    flex: 1,
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
  });


MonnifyPointTopupPayment.navigationOptions = {
  headerTitle: 'Make Payment',
  headerTintColor: colors.gray600,
  headerTitleContainerStyle: styles.headerContainer,
  headerTransparent: true,
  headerStyle: styles.header,
  headerTitleStyle: styles.headerTitle,
  headerBackTitle: ' ',
  headerRight: <Text />,
}


export default MonnifyPointTopupPayment;