import { Alert, ToastAndroid, Platform } from 'react-native';
import { sleep } from './Misc';

interface ToastInterface {
  short: (message: string) => void,
  long: (message: string) => void,
  alert: (message: string, delay?: number) => void,
  success: (message: string, delay?: number) => void,
  warning: (message: string, delay?: number) => void,
  error: (message: string, delay?: number) => void,
}

/**
 * The toast module helps to display toast
 * messages on the to the user.
 * @var ToastInterface
 */
const Toast: ToastInterface = {
  /**
   * This is used to show a toast message for the user,
   * although the duration only works on android.
   * @param {string} message meant to be displayed
   */
  short: function (message: string) {
    // use the alert on iOS.
    if (Platform.OS === 'ios') {
      return this.alert(message);
    }
    // show toast for a longer period of time on android.
    ToastAndroid.show(message, ToastAndroid.SHORT);
  },

  /**
   * This is used to show a toast message for the user,
   * although the duration only works on android.
   * @param {string} message meant to be displayed
   */
  long: function (message: string) {
    // use the alert on iOS
    if (Platform.OS === 'ios') {
      return this.alert(message);
    }
    // Show toast for a longer period of time on android.
    ToastAndroid.show(message, ToastAndroid.LONG);
  },

  /**
  * This pops up an alert dialog..
  * @param {string} message meant to be displayed
  * @param {number} delay amount of delay time
  */
  alert: async function (message: string, delay: number = 400) {
    await sleep(delay);
    Alert.alert('Attention', message);
  },

  /**
  * This pops up an alert dialog..
  * @param {string} message meant to be displayed
  * @param {number} delay amount of delay time
  */
  success: async function (message: string, delay: number = 400) {
    await sleep(delay);
    Alert.alert('Success', message);
  },

  /**
  * This pops up an alert dialog..
  * @param {string} message meant to be displayed
  * @param {number} delay amount of delay time
  */
  warning: async function (message: string, delay: number = 400) {
    await sleep(delay);
    Alert.alert('Attention', message);
  },

  /**
  * This pops up an alert dialog..
  * @param {string} message meant to be displayed
  * @param {number} delay amount of delay time
  */
  error: async function (message: string, delay: number = 400) {
    await sleep(delay);
    Alert.alert('Error', message);
  },
};

// export Toast module as default
export default Toast;
