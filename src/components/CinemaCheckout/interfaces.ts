import { NavigationStackScreenProps } from "react-navigation-stack";
import { NavigationParams } from "react-navigation";
import { CartItem } from "contexts/CartContext";
import { CoordsInfo } from "api/CoordsLookup.api";
import { NewOrder } from "api/CreateCinemaOrder.api";
import { UserInterface } from "contexts/UserContext";
import { Cinema } from "api/FetchCinemas";

export interface CinemaCheckoutProps extends NavigationStackScreenProps<NavigationParams> {
  location: CoordsInfo | null,
  cart: {
    add: (item: CartItem) => void,
    remove: (itemId: string | Array<string>, force?:boolean) => void,
    update: (itemId: string, item: CartItem) => void,
    items: Array<CartItem>,
  },
  user: UserInterface,
}

export interface CinemaCheckoutState {
  isUpdatingOrder: boolean,
  isFetching: boolean,
  order: null | NewOrder,
  checkoutUrl: null | string,
  status: 'pending' | 'ongoing' | 'paid' | 'verified' | 'updatingOrder' | 'addingPoints' | 'updatingRedemption',
  usePoints: number,
  redeptionRef: string | null,
  pointsBalance: number,
  pointsGained: number,
  cinema: Cinema | null,
  bookingReference: string | null,
}
