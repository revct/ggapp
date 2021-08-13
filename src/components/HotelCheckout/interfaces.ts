import {NavigationStackScreenProps} from 'react-navigation-stack';
import {NavigationParams} from 'react-navigation';
import {CartItem} from 'contexts/CartContext';
import {CoordsInfo} from 'api/CoordsLookup.api';
import {UserInterface} from 'contexts/UserContext';
import {Hotel} from 'api/Hotels.api';
import {ReservationGuest} from 'api/NewReservation.api';

export interface HotelCheckoutProps
  extends NavigationStackScreenProps<NavigationParams> {
  location: CoordsInfo | null;
  cart: {
    add: (item: CartItem) => void;
    remove: (itemId: string | Array<string>, force?: boolean) => void;
    update: (itemId: string, item: CartItem) => void;
    items: Array<CartItem>;
  };
  user: UserInterface;
}

export interface HotelCheckoutState {
  isUpdatingOrder: boolean;
  isFetching: boolean;
  checkoutUrl: null | string;
  status:
    | 'pending'
    | 'ongoing'
    | 'paid'
    | 'verified'
    | 'updatingOrder'
    | 'addingPoints'
    | 'updatingRedemption';
  usePoints: number;
  redeptionRef: string | null;
  pointsBalance: number;
  pointsGained: number;
  hotel: Hotel | null;
  paymentReference: string | null;
  reservationId: number | null;
  guest:
    | null
    | ReservationGuest & {
        email: string;
        phoneNumber: string;
      };
}
