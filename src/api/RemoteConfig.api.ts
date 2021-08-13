import remoteConfig from '@react-native-firebase/remote-config';
import Logger from '../utils/Logger';
import {safeJSONParse} from '../utils/Misc';
const maxAge = 60 * 60 * 1000;

export type SuspensionNotice = {
  [k in 'cinema' | 'restaurant' | 'hotel']: string
};

type RemoteConfigKeys =
  | 'rooms_info'
  | 'hotels'
  | 'special_offers'
  | 'shipping_charge'
  | 'cinemas_token'
  | 'restaurants'
  | 'suspension_notice'
  | 'restaurant_hours'
  | 'cinemas';

export default async function RemoteConfigApi<R>(
  key: RemoteConfigKeys,
  fetchWhenExpired: boolean = true,
): Promise<R> {
  try {
    // set config settings
    await remoteConfig().setConfigSettings({
      isDeveloperModeEnabled: !!__DEV__,
    });
    // check if remote config is old
    if (
      Date.now() - remoteConfig().lastFetchTime > maxAge &&
      fetchWhenExpired
    ) {
      // fetch and activate new date
      await remoteConfig().fetch();
      await remoteConfig().activate();
    }
    await remoteConfig().setDefaults({
      special_offers: JSON.stringify([]),
      suspension_notice: JSON.stringify({}),
    });
    // get value for spacified key
    const snapshot = remoteConfig().getValue(key);
    // parse returned data
    const data = safeJSONParse(snapshot.value);
    // resolve promise with data
    return Promise.resolve(data);
  } catch (error) {
    // don't fetch if last fetch was throttled
    if (
      remoteConfig().lastFetchStatus === 'throttled' ||
      /due to throttling/i.test(error.message)
    ) {
      return RemoteConfigApi(key, false);
    }
    // log the error that occured
    Logger(error);
    // resolve promise with error
    return Promise.reject(error);
  }
}
