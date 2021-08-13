import RemoteConfigApi from './RemoteConfig.api';

export type IRestaurantHourDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface IRestaurantHour {
  day: IRestaurantHourDay;
  open_time: string;
  close_time: string;
}

type Response = {
  success: boolean;
  message?: string;
  data?: Array<IRestaurantHour>;
};

export default async function RestaurantHoursApi(): Promise<Response> {
  return new Promise(async res => {
    try {
      // get snapshot value
      const data = await RemoteConfigApi<IRestaurantHour[]>('restaurant_hours');
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
