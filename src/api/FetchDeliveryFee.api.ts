import RemoteConfigApi from './RemoteConfig.api';

export default async function FetchDeliveryFeeApi(): Promise<number> {
  return new Promise(async (resolve, reject) => {
    try {
      // get snapshot value
      const data = await RemoteConfigApi('shipping_charge');
      // resolve promise
      resolve(Number(data));
    } catch (e) {
      // reject with error
      reject(e);
    }
  });
}
