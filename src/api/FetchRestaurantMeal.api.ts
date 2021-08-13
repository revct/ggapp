import {RestaurantApi} from './Api';
import {Meal} from './GetMenuMeals.api';

type Response = Meal;

export default async function FetchRestaurantMealApi(
  id: number,
  options?: {vatiation?: number},
): Promise<Response> {
  let url = 'products/' + id;
  if (options && options.vatiation) {
    url += '/variations/' + options.vatiation;
  }
  try {
    const response = await RestaurantApi.get(url, {
      per_page: 15,
      status: 'publish',
      featured: true,
    });
    return Promise.resolve(response);
  } catch (e) {
    return Promise.reject(e);
  }
}
