import {NavigationStackScreenProps} from 'react-navigation-stack';
import {NavigationParams} from 'react-navigation';
import {CartItem} from '../../contexts/CartContext';
import {CoordsInfo} from '../../api/LocationSearch.api';
import {NewOrder} from '../../api/CreateRestaurantOrder.api';
import {UserInterface} from 'contexts/UserContext';

interface NavigationState {
  deliveryLocation: CoordsInfo;
  items: Array<string>;
}

export interface SelectSectionProps {
  options: Array<string>;
  selected: string;
  icon?: React.ReactNode;
  placeholder: string;
  title: string;
  description?: string;
  onSelect?: (v: string) => void;
  disabled?: boolean;
  error?: string;
  attachedField?: React.ReactNode;
}

export interface RestaurantCheckoutProps
  extends NavigationStackScreenProps<NavigationParams, NavigationState> {
  location: CoordsInfo | null;
  cart: {
    add: (item: CartItem) => void;
    remove: (itemId: string | Array<string>, force?: boolean) => void;
    update: (itemId: string, item: CartItem) => void;
    items: Array<CartItem>;
  };
  user: UserInterface;
  deliveryFee: number;
}

export interface RestaurantCheckoutState {
  isUpdatingOrder: boolean;
  isFetching: boolean;
  order: null | NewOrder;
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
  isFetchingRestaurants: boolean;
  area: string;
  deliveryTypes: Array<string>;
  deliveryType: string;
  showLess: boolean;
  deliveryAddress: string;
}
