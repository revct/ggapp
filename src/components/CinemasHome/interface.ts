import {NavigationParams, NavigationScreenProp} from 'react-navigation';
import {Performance, Film} from 'api/FetchPerformanceList';
import {Cinema} from 'api/FetchCinemas';

export interface CinemasHomeProps {
  navigation: NavigationScreenProp<NavigationParams>;
}

export interface CinemasHomeState {
  isFetching: boolean;
  featured: Array<Performance>;
  errorMessage: string | null;
  currentTab: number;
  cinema: Cinema | null;
  suspensionNotice?: string | null;
  filmList:Array<Film>;
}
