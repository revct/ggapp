import {NavigationScreenProp, NavigationParams} from 'react-navigation';
import {Room} from 'api/AvailableRooms.api';
import {Hotel} from 'api/Hotels.api';
import {CartItem} from 'contexts/CartContext';

interface NavigationState {
  room: Room;
  hotel: Hotel;
  roomConfig: {
    quantity: number;
    arrival: Date;
    departure: Date;
  };
}

export interface HotelRoomProps {
  navigation: NavigationScreenProp<NavigationParams, NavigationState>;
  cart: {
    add: (item: CartItem) => void;
  };
}

export interface HotelRoomState {
  quantity: number;
  location: string;
  currentImage: {uri: string} | null;
  arrivalDate: null | Date;
  departureDate: null | Date;
  selectDate: 'arrival' | 'departure' | null;
}
