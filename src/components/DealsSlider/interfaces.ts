import { NavigationParams, NavigationScreenProp, NavigationRoute } from "react-navigation";
import { SpecialOfferInterface } from "api/FetchSpecialOffers.api";

export interface RenderRestaurantDealProps {
  item: SpecialOfferInterface,
  index: number
};

export interface DealsSliderProps {
  navigation: NavigationScreenProp<NavigationRoute<NavigationParams>>
}

export interface DealsSliderState {
  isPending: boolean,
  data: Array<SpecialOfferInterface>,
  errorMessage: null | string
}
