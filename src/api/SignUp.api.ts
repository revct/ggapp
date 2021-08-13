import { RestaurantApi, ApiClassInterface } from './Api';
import Logger from 'utils/Logger';
import { UserInterface } from 'contexts/UserContext';

type RequestData = {
	first_name: string,
	last_name: string,
  email: string,
	username: string,
  password: string,
  avatar_url?: string,
  reference: string,
}

interface Response extends UserInterface{
  message?: string,
  _links: {
    [k:string]: {
      href: string
    }
  }
};

export default class SignUpApi implements ApiClassInterface {

  canceled: boolean = false;

  cancel = () => {
    this.canceled = true;
  }

  fetch = async (data: RequestData): Promise<UserInterface> => {
    this.canceled = false;
    try {
      // make a request to woo commerce for the customer bearing the user ID
      const response: Response = await RestaurantApi.post('customers', {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        username: data.username,
        password: data.password,
        avatar_url: data.avatar_url,
        billing_info: {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: '',
        },
        meta_data:[
          {
            key:'reference',
            value:data.reference || ''
          }
        ]
      });

      // throw error if is canceled
      if(this.canceled) {
        throw new Error('canceled');
      }

      // Stop if account creation was not successful
      if(!response.id) {
        throw new Error(response.message || 'An error occured, please try again in a moment.');
      }

      // remove links from response object
      delete response._links;

      // resolve promise with user info
      return Promise.resolve(response);
    } catch (e) {
      Logger(e);
      return Promise.reject(e);
    }
  }
}
