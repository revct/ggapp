import React from 'react';
import {Meal} from 'api/GetMenuMeals.api';
import {NavigationParams, NavigationScreenProp} from 'react-navigation';

interface NavigationState {
  menuId: number;
  menuName: string;
  headerRight: React.ReactNode;
  isSearchEnabled?: boolean;
  onToggleSearch?: () => void;
}

export interface RestaurantMenuProps {
  navigation: NavigationScreenProp<NavigationParams, NavigationState>;
}

export interface RestaurantMenuState {
  isFetching: boolean;
  data: Array<Meal>;
  errorMessage: null | string;
  page: number;
  request: null | number;
  search: string;
  isSearchEnabled: boolean;
  endIsReached: boolean;
}
