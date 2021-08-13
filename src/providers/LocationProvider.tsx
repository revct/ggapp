import React from 'react';
import {CoordsInfo} from 'api/LocationSearch.api';
import LocationContext from 'contexts/LocationContext';

interface LocationProviderProps {

}

interface LocationProviderState {
  location: CoordsInfo | null,
}

export default class LocationProvider extends React.Component<
  LocationProviderProps,
  LocationProviderState
> {

  state:LocationProviderState = {
    location: null,
  };

  setLocation = (location: CoordsInfo | null) => {
    this.setState({
      location: location
    });
  }

  render() {
    const {location} = this.state;
    const {children} = this.props;
    return(
      <LocationContext.Provider value={{
        setLocation: this.setLocation,
        location: location,
      }}>{children}</LocationContext.Provider>
    );
  }
}
