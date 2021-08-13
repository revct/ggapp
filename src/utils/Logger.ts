import Axios from 'axios';
import crashlytics from '@react-native-firebase/crashlytics';

// logs errors, depending on the environment
export default function Logger(e: Error, report: boolean = true) {
  // stop if was canceled
  if (__DEV__) {
    console.log([e]);
  } else {
    if (Axios.isCancel(e) || e.message === 'canceled' || !report) {
      return;
    }
    crashlytics().recordError(e);
  }
}
