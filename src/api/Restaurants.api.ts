import RemoteConfigApi from './RemoteConfig.api';

export interface Restaurant {
  id: number;
  outlet_name: string;
  sub_account_code: string;
  closed: boolean;
  delivering_to: string[];
  delivering_to_x: string[];
  location: string;
}

type Response = {
  success: boolean;
  message?: string;
  data?: Array<Restaurant>;
};

export default async function RestaurantsApi(): Promise<Response> {
  return new Promise(async res => {
    try {
      // get snapshot value
      const data = await RemoteConfigApi<Restaurant[]>('restaurants');
      // resolve promise with data
      res({success: true, data: data});
    } catch (e) {
      // get error message
      let errorMessage = e.message;
      if (/network/i.test(errorMessage)) {
        errorMessage = 'Please check your internet connection and try again.';
      }
      // resolve promise with error
      res({success: false, message: errorMessage});
    }
  });
}
