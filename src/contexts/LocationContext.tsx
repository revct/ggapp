import React from 'react';
import { CoordsInfo } from 'api/LocationSearch.api';

const location:{
  setLocation: ((loc:CoordsInfo) => void) | null,
  location: null | CoordsInfo,
} = {
  setLocation: null,
  location: null,
};

const LocationContext = React.createContext(location);

export const LocationContextProvider = LocationContext.Provider;

export const LocationContextConsumer = LocationContext.Consumer;

export const withLocation = (Component:any) => {
  return class withLocation extends React.Component {
    static navigationOptions = Component.navigationOptions;
    render(){
      return (
        <LocationContextConsumer>
          {context => <Component
            {...this.props}
            location={context.location}
            setLocation={context.setLocation} />
          }
        </LocationContextConsumer>
      );
    }
  }
}

export default LocationContext;
