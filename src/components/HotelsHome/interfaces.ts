import {NavigationScreenProp, NavigationParams} from 'react-navigation';
import {Hotel} from 'api/Hotels.api';

export interface HotelsHomeProps {
  navigation: NavigationScreenProp<NavigationParams>;
}

export interface HotelsHomeState {
  isPending: boolean;
  errorMessage: null | string;
  list: Array<Hotel>;
  title: string;
  subtitle: string;
  backgroundImage: string | null;
}
