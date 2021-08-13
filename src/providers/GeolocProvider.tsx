import React from 'react';
import { CoordsInfo } from 'api/CoordsLookup.api';
import GeolocContext, { Coords } from 'contexts/GeolocContext';
import Geolocation from 'components/Goelocation/Geolocation';

interface GeolocProviderProps {

}

interface GeolocProviderState {
  isPending: boolean,
  geoloc: CoordsInfo | null,
  coords: Coords | null,
}

export default class GeolocProvider extends React.Component<
  GeolocProviderProps,
  GeolocProviderState
  > {

  state: GeolocProviderState = {
    isPending: false,
    geoloc: null,
    coords: null,
  };

  setCoords = (coords: Coords | null) => {
    this.setState({
      coords: coords
    });
  }

  setGeoloc = (geoloc: CoordsInfo | null) => {
    this.setState({
      geoloc: geoloc
    });
  }

  render() {
    const { geoloc, coords } = this.state;
    const { children } = this.props;
    return (
      <>
        <Geolocation
          onCoords={this.setCoords}
          onGoeloc={this.setGeoloc}
        />
        <GeolocContext.Provider value={{
          setCoords: this.setCoords,
          coords: coords,
          setGeoloc: this.setGeoloc,
          geoloc: geoloc,
        }}>{children}</GeolocContext.Provider>
      </>
    );
  }
}
