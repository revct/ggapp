import {RestaurantApi, ApiClassInterface} from './Api';
import Axios, {Canceler} from 'axios';
import Logger from 'utils/Logger';
import {UserInterface} from 'contexts/UserContext';

type RequestData = {
  username: string;
  password: string;
};

type LoginResponse = {
  data: {
    status: string;
    error?: string;
    user?: {
      id: number;
    };
  };
};

interface CustomerResponse extends UserInterface {
  _links: {
    [k: string]: {
      href: string;
    };
  };
}

export default class LoginApi implements ApiClassInterface {
  canceler?: Canceler;

  canceled: boolean = false;

  cancel = () => {
    if (this.canceler) {
      this.canceler();
    }
    this.canceled = true;
  };

  fetch = async (data: RequestData): Promise<UserInterface> => {
    this.canceled = false;
    try {
      // first get user info from wordpress
      const loginResponse: LoginResponse = await Axios.get(
        'https://genesisrestaurantng.com/api/auth/generate_auth_cookie?username=' +
          data.username +
          '&password=' +
          data.password,
        {cancelToken: new Axios.CancelToken(c => (this.canceler = c))},
      );
      // throw erro if canceld
      if (this.canceled) {
        throw new Error('canceled');
      }
      // stop if login failed
      if (loginResponse.data.error) {
        throw new Error(loginResponse.data.error);
      }
      // stop if the user info was not found in the response
      if (!loginResponse.data.user) {
        throw new Error('Failed to log you in, please try again in a moment.');
      }
      // make a request to woo commerce for the customer bearing the user ID
      const customerResponse: CustomerResponse = await RestaurantApi.get(
        'customers/' + loginResponse.data.user.id,
      );
      if (this.canceled) {
        throw new Error('canceled');
      }
      delete customerResponse._links;
      // resolve promise with user info
      return Promise.resolve(customerResponse);
    } catch (e) {
      Logger(e);
      return Promise.reject(e);
    }
  };
}
