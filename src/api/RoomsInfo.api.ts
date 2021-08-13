import RemoteConfigApi from './RemoteConfig.api';

export interface RoomInfo {
  type: 'CLS' | 'CLU' | 'STS' | 'DLX' | 'DLS';
  description: string;
  facilities: string;
  images: Array<string>;
  hotel: 'gen-soj' | 'gen-cotg' | 'gen-cstl';
}

type Result = Array<RoomInfo>;

type Response = {
  success: boolean;
  message?: string;
  data?: Result;
};

export default async function RoomsInfoApi(): Promise<Response> {
  return new Promise(async res => {
    try {
      // get snapshot value
      const data: Result = await RemoteConfigApi('rooms_info');
      // resolve promise with data
      res({success: true, data: data});
    } catch (e) {
      let errorMessage = e.message;
      if (/network/i.test(errorMessage)) {
        errorMessage = 'Please check your internet connection and try again.';
      }
      // resolve promise with error
      res({success: false, message: errorMessage});
    }
  });
}
