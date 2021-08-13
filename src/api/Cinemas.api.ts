import RemoteConfigApi from './RemoteConfig.api';

export interface Cinema {
  id: number;
  cinema_name: string;
  sub_account_code: string;
  code:string;
}

type Response = {
  success: boolean;
  message?: string;
  data?: Array<Cinema>;
};

export default async function CinemasApi(): Promise<Response> {
  return new Promise(async res => {
    try {
      // get snapshot value
      const data = await RemoteConfigApi<Cinema[]>('cinemas');
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
