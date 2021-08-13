import { NavigationScreenProp, NavigationParams } from "react-navigation";
import { RestaurantMenu } from "contexts/ReastaurantMenuContext";
import { FeaturedMeal } from "api/GetFeaturedMeals.api";

export interface RestaurantsHomeProps {
  navigation: NavigationScreenProp<NavigationParams>,
  restaurantMenu: {
    set: (list:Array<RestaurantMenu>) => void,
    clear: () => void,
    list: Array<RestaurantMenu>,
  }
}

interface FoodInterface {
  image: string,
  price: number,
  name: string,
  rating: number
}

interface FoodCategoryInterface {
  image: string,
  name: string
}

export interface RestaurantsHomeState {
  isFetchingMenu: boolean,
  menusError: null | string,
  isFetchingFeatured: boolean,
  fearuredError: null | string,
  featuredMeals: Array<FeaturedMeal>,
  menus: Array<RestaurantMenu>,
  isReady: boolean,
  isSearchEnabled: boolean,
  search: string,
}
