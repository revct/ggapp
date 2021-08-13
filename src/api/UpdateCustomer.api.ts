import { RestaurantApi, ApiClassInterface } from './Api';
import Logger from 'utils/Logger';
import { UserInterface } from 'contexts/UserContext';
import {BillingInfo, ShippingInfo} from './CreateRestaurantOrder.api';

type RequestData = {
	first_name: string,
	last_name: string,
  email: string,
  phone: string,
  city: string,
  state: string,
  address: string,
  password?: string,
  avatar_url?: string,
}

type UpdateData = {
	first_name: string,
	last_name: string,
  email: string,
	username?: string,
  password?: string,
  avatar_url?: string,
  billing: BillingInfo,
  shipping: ShippingInfo,
}


interface Response extends UserInterface{
  message?: string,
  _links: {
    [k:string]: {
      href: string
    }
  }
};

export default class UpdateCustomerApi implements ApiClassInterface {

  canceled: boolean = false;

  cancel = () => {
    this.canceled = true;
  }

  fetch = async (id:number, data: RequestData): Promise<UserInterface> => {
    this.canceled = false;
    // create update object
    const update:UpdateData = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      billing: {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone.replace(/\s/g, ''),
        address_1: data.address,
        state: data.state,
        city: data.city,
        country: '',
      },
      shipping: {
        first_name: data.first_name,
        last_name: data.last_name,
        address_1: data.address,
        city: data.city,
        state: data.state,
        postcode: '',
        country: ''
      }
    }
    // add password
    if(data.password) {
      update.password = data.password;
    }
    // add avatar url
    if(data.avatar_url) {
      update.avatar_url = data.avatar_url;
    }

    try {
      // make a request to woo commerce for the customer bearing the user ID
      const response:Response = await RestaurantApi.put('customers/' + id, update);

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
