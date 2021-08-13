import {ApiClassInterface} from './Api';
import Axios, {Canceler} from 'axios';
import Logger from 'utils/Logger';

type RequestData = {
  email: string;
  password: string;
  code: string;
};

type ForgotResponse = {
  data: {
    status: number;
  };
  message: string;
};

export default class ForgotPasswordApi implements ApiClassInterface {
  canceler?: Canceler;

  canceled: boolean = false;

  cancel = () => {
    if (this.canceler) {
      this.canceler();
    }
    this.canceled = true;
  };

  fetch = async (data: RequestData): Promise<boolean> => {
    this.canceled = false;
    try {
      // first get user info from wordpress
      await Axios.post<ForgotResponse>(
        'https://genesisrestaurantng.com/wp-json/bdpwr/v1/set-password',
        {email: data.email, code: data.code, password: data.password},
        {cancelToken: new Axios.CancelToken(c => (this.canceler = c))},
      );
      // throw erro if canceld
      if (this.canceled) {
        throw new Error('canceled');
      }
      // resolve promise with user info
      return Promise.resolve(true);
    } catch (e) {
      Logger(e);
      return Promise.reject(e);
    }
  };
}
