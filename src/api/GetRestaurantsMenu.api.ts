import {RestaurantApi} from './Api';
import {RestaurantMenu} from 'contexts/ReastaurantMenuContext';
import Logger from 'utils/Logger';

type Response = Array<RestaurantMenu>;

export default async function GetRestaurantsMenuApi(location): Promise<Response> {
  try {
    const options = location == "ph"?{
      per_page: 100,
      status: 'publish',
    }:{
      per_page: 100,
      status: 'publish',
      exclude:["17","239"]
    };
    const response = await RestaurantApi.get('products/categories', options);
    if (!Array.isArray(response)) {
      Logger(new Error(JSON.stringify(response)));
      return Promise.reject(new Error('Failed to load menus.'));
    }
    return Promise.resolve(response);
  } catch (e) {
    Logger(e);
    return Promise.reject(e);
  }
}
