import RemoteConfigApi from './RemoteConfig.api';
import {asyncStore} from 'utils/Async';
import {STORE_KEYS} from 'configs/async';

export interface Hotel {
  id: string;
  name: string;
  image: string;
  hotelCode: string;
  location: string;
  address: string;
  services: {
    available_rooms: string;
    create_reservation: string;
    update_reservation: string;
    cancel_reservation: string;
  };
}

type Result = {
  title: string;
  sub_title: string;
  background_image: string;
  hotels: Array<Hotel>;
};

type Response = {
  success: boolean;
  message?: string;
  data?: Result;
};

export default async function HotelsApi(): Promise<Response> {
  return new Promise(async res => {
    try {
      // get snapshot value
      const data: Result = await RemoteConfigApi('hotels');
      // fetch hotels
      await asyncStore(
        STORE_KEYS.REMOTE_CONFIG.replace('{key}', 'hotels'),
        data,
      );
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
