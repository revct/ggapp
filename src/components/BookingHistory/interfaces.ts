import {NavigationStackScreenProps} from 'react-navigation-stack';
import {NavigationParams} from 'react-navigation';
import {UserInterface} from 'contexts/UserContext';

export interface Booking {
  id: number;
  code: string;
  price: number,
  customerName: string,
  roomName: string;
  hotelName: string;
  quantity: number;
  image: string | null;
  reference: string;
  reservationId: number;
  email: string;
  arrival: string;
  departure: string;
  expiresAt: number;
  createdAt: number;
}

export interface BookingsHistoryProps
  extends NavigationStackScreenProps<NavigationParams> {
  user: UserInterface | null;
}

export interface BookingsHistoryState {
  isPending: boolean;
  isRefreshing: boolean;
  completed: Array<Booking>;
  booked: Array<Booking>;
  currnetPage: number;
  openModel: boolean;
  selected: Booking | null;
}
