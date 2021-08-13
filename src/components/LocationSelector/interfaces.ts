import React from 'React';
import { CoordsInfo } from "api/LocationSearch.api";
import { CoordsInfo as GeoCoordsInfo } from "api/CoordsLookup.api";
import { NavigationFocusInjectedProps, NavigationParams } from 'react-navigation';

export interface LocationSelectorProps extends NavigationFocusInjectedProps<NavigationParams> {
  isFocused: boolean,
  location: CoordsInfo | null,
  geoloc: GeoCoordsInfo | null,
  renderer?: (show:() => void, locations:CoordsInfo | null) => React.ReactNode,
  setLocation: (location:CoordsInfo) => void,
  disabled?: 'disabled' | boolean,
  scoped?: boolean,
  value?: CoordsInfo,
  onChange?: (location: CoordsInfo) => void
}

export interface Place {
  [k:string]: any
}

export interface LocationSelectorState {
  search: string,
  searchQuery: string,
  isSearching: boolean,
  isFetching: boolean,
  errorMessage: string | null,
  visible: boolean,
  locations: Array<CoordsInfo>,
  isSelecting: boolean,
  selectedLocation: CoordsInfo | null,
}

export type RenderLocationProp = {
  item: CoordsInfo | GeoCoordsInfo,
  index?:number,
  icon?:React.ReactNode,
  active?: boolean,
  selected?: boolean,
  caption?: string,
  hideDivider?: boolean,
};
