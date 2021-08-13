import React from 'react';
import { CoordsInfo } from 'api/CoordsLookup.api';

export interface Coords{
  lat: number,
  lng: number,
}

interface GeolocContextInterface  {
  setCoords: ((coord:Coords) => void) | null,
  coords: Coords | null,
  setGeoloc: ((data:CoordsInfo) => void) | null,
  geoloc: CoordsInfo | null,
}

const initial:GeolocContextInterface = {
  setCoords: null,
  coords: null,
  setGeoloc: null,
  geoloc: null,
};

const GeolocContext = React.createContext(initial);

export const withGeoloc = (Component:any) => {
  return class withGeoloc extends React.Component {
    static navigationOptions = Component.navigationOptions;
    render() {
      return (
        <GeolocContext.Consumer>
          {context => (<Component {...this.props} {...context} />)}
        </GeolocContext.Consumer>
      );
    }
  }
}

export default GeolocContext;
