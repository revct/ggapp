import {ApiClassInterface} from './Api';
import Axios, {Canceler} from 'axios';
import Logger from 'utils/Logger';
import {UserInterface} from 'contexts/UserContext';
import SignUpApi from './SignUp.api';
import LoginApi from './Login.api';

type RequestData = {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  avatar_url?: string;
};

export default class SocialLoginApi implements ApiClassInterface {
  canceler?: Canceler;

  canceled: boolean = false;

  loginApi: LoginApi;

  signupApi: SignUpApi;

  constructor() {
    this.loginApi = new LoginApi();
    this.signupApi = new SignUpApi();
  }

  cancel = () => {
    this.canceled = true;

    if (this.loginApi) {
      this.loginApi.cancel();
    }

    if (this.signupApi) {
      this.signupApi.cancel();
    }
  };

  handle = async (data: RequestData): Promise<UserInterface> => {
    this.canceled = false;
    try {
      let user: UserInterface;
      try {
        // try to log in new user
        user = await this.loginApi.fetch({
          username: /facebook-/.test(data.username) ? data.username : data.email,
          password: data.password,
        });
        return Promise.resolve(user);
      } catch (e) {
        if (Axios.isCancel(e) || e.message === 'canceled') {
          return Promise.reject(e);
        }
      }
      // do nothing
      user = await this.signupApi.fetch({
        first_name: data.first_name,
        last_name: data.last_name,
        username: data.username,
        email: data.email,
        password: data.password,
        avatar_url: data.avatar_url,
      });
      return Promise.resolve(user);
    } catch (e) {
      return Promise.reject(e);
    }
  };
}
