import { NavigationScreenProp, NavigationParams } from "react-navigation";
import { SpecialOfferInterface } from "api/FetchSpecialOffers.api";

export interface SpecialOffersProps {
  navigation: NavigationScreenProp<NavigationParams>
}

export interface SpecialOffersState {
  isPending: boolean,
  data: Array<SpecialOfferInterface>,
  errorMessage: null | string
}
