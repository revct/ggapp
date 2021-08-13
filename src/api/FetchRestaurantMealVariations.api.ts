import {RestaurantApi} from './Api';
import {Meal} from './GetMenuMeals.api';

export interface MealVariation extends Meal {}

export default async function FetchRestaurantMealVariationsApi(
  id: number,
): Promise<MealVariation[]> {
  try {
    const response = await RestaurantApi.get(`products/${id}/variations`, {
      per_page: 15,
      status: 'publish',
      featured: true,
    });
    return Promise.resolve(response);
  } catch (e) {
    return Promise.reject(e);
  }
}
