import { Client } from 'bugsnag-react-native';

/**
 * App data encryption key.
 *
 * @var string
 */
export const ENCRYPTION_KEY = '398h=83y493483sjdkjsbh49h38498==';

/**
 * AppDebug status, if tru will show more
 * details when an error occurs.
 *
 * @var boolean
 */
export const DEBUG = __DEV__;

/**
 * Bugsnag error reporting client.
 *
 * @var object
 */
export const BUGSNAG = new Client(
  __DEV__
    ? 'fa109e50eb3bc4a56dbd85b77937c61b'
    : '02aa31a94adb4897f56d0a94a1556c58'
);

/**
 * Naira sign used when display amounts in naira.
 *
 * @var string
 */
export const NAIRA_SIGN = '₦';

export const LIVE_CHAT_URL =
  'https://tawk.to/chat/5cc2e6caee912b07bec4fac9/default';
