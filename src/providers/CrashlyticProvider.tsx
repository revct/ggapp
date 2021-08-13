import React from 'react';
import crashlytics from '@react-native-firebase/crashlytics';
import {Alert} from 'react-native';
import {asyncGet, asyncStore} from 'utils/Async';
import {STORE_KEYS} from 'configs/async';

interface CrashlyticsProviderState {
  enabled: boolean;
}

class CrashlyticsProvider extends React.Component<
  {},
  CrashlyticsProviderState
> {
  state: CrashlyticsProviderState;
  constructor(props: {}) {
    super(props);
    this.state = {
      enabled: crashlytics().isCrashlyticsCollectionEnabled,
    };
  }

  componentDidMount() {
    this.requestEnableCrashlytics();
  }

  requestEnableCrashlytics = async () => {
    const {enabled} = this.state;
    const dontAsk = await asyncGet(STORE_KEYS.ASK_FOR_CRASHLYTICS);
    if (enabled) {
      return crashlytics().log('App Mounted...');
    }
    if (dontAsk === 'no') {
      return;
    }
    Alert.alert(
      'Enable Crash Reports',
      'Would you like to help Genesis gather anonymous user crash ' +
        ' reports to help better your experience on the this app?',
      [
        {text: 'No', onPress: this.answerEnableCrashlytics.bind(this, false)},
        {text: 'Yes', onPress: this.answerEnableCrashlytics.bind(this, true)},
      ],
    );
  };

  answerEnableCrashlytics = async (allow: boolean) => {
    if (!allow) {
      await asyncStore(STORE_KEYS.ASK_FOR_CRASHLYTICS, 'no');
      return;
    }
    this.toggleCrashlytics();
  };

  toggleCrashlytics = async () => {
    await crashlytics()
      .setCrashlyticsCollectionEnabled(true)
      .then(() =>
        this.setState(
          {
            enabled: crashlytics().isCrashlyticsCollectionEnabled,
          },
          () => crashlytics().log('Crashlytics enabled...'),
        ),
      );
  };

  render() {
    const {children} = this.props;
    return <>{children}</>;
  }
}

export default CrashlyticsProvider;
