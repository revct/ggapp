import {NavigationScreenProp, NavigationParams} from 'react-navigation';
import {Room} from '../../api/AvailableRooms.api';

interface NavigationState {
  hotel: {
    id: string;
    name: string;
    image: string;
  };
}

export interface HotelRoomsProps {
  navigation: NavigationScreenProp<NavigationParams, NavigationState>;
}

export interface HotelRoomsState {
  isPending: boolean;
  list: Array<Room>;
  errorMessage: null | string;
  hasSearched: boolean;
  arrival: Date | null;
  departure: Date | null;
  quantity: number;
}
