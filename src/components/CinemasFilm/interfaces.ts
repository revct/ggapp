import {NavigationScreenProp, NavigationParams} from 'react-navigation';
import {Cinema} from 'api/FetchCinemas';
import {CartItem} from 'contexts/CartContext';
import {Performance} from 'api/FetchPerformanceList';
import {PerformanceReadItem} from 'api/ReadCinemaProduct';

interface NavigationState {
  filmInfo: Performance;
  id: number;
  deal: boolean;
  cinema: string;
}

export interface CinemasFilmProps {
  navigation: NavigationScreenProp<NavigationParams, NavigationState>;
  cart: {
    add: (item: CartItem) => void;
  };
}

export interface CinemasFilmState {
  isPending: boolean;
  cinema: Cinema | null;
  time: Performance | null;
  quantity: number;
  currentTab: number;
  info: PerformanceReadItem | null;
  performance: Performance | null;
  errorMessage: string | null;
}
