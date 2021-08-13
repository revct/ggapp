import {NavigationScreenProp, NavigationParams} from 'react-navigation';
import {Meal} from 'api/GetMenuMeals.api';
import {NavigationStackScreenProps} from 'react-navigation-stack';
import {CoordsInfo} from 'api/LocationSearch.api';
import {CoordsInfo as GeoCoordsInfo} from 'api/CoordsLookup.api';
import {IWithCart} from 'contexts/CartContext';
import {MealVariation} from 'api/FetchRestaurantMealVariations.api';
import {StyleProp, ViewStyle} from 'react-native';
import {Restaurant} from 'api/Restaurants.api';

export interface RestaurantMealNavState {
  meal: Meal;
  deal: boolean;
  id: number;
  variant: number;
}

export interface RestaurantMealNavOptionsProp
  extends NavigationStackScreenProps<
    NavigationParams,
    RestaurantMealNavState
  > {}

export interface RestaurantMealProps extends IWithCart {
  navigation: NavigationScreenProp<NavigationParams, RestaurantMealNavState>;
  location: CoordsInfo | null;
  geoloc: GeoCoordsInfo | null;
}

export interface RestaurantMealState {
  isFetching: boolean;
  data: Meal | null;
  errorMessage: null | string;
  quantity: number;
  info: Meal & {variantId?: number} | null;
  restaurant: Restaurant | null;
  variationsConfig: {
    [k: string]: string;
  };
  sizes: MealVariation[];
}

export interface IRestaurantSelectorProps {
  selected?: Restaurant;
  onSelect?: (value: Restaurant) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  location:string
}
