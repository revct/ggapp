import React from 'react';


export interface PointsContextInterface {
  pointsToken: string | null,
  isGettingToekn: boolean,
  isGettingPoints: boolean,
  totalPoints: number,
  getTotalPoints: (() => void) | null,
  getPointsToken: ((success?: () => void, failure?: (error:string) => void) => void) | null,
}

const initial:PointsContextInterface = {
  totalPoints: 0,
  pointsToken: null,
  isGettingToekn: false,
  isGettingPoints: false,
  getTotalPoints: null,
  getPointsToken: null,
};

export const PointsContext = React.createContext(initial);

export const PointsContextProvider = PointsContext.Provider;

export const PointsContextConsumer = PointsContext.Consumer;

export const withPoints = (Component:any) => {
  return class withPoints extends React.Component {
    static navigationOptions = Component.navigationOptions;
    render(){
      return (
        <PointsContextConsumer>
          {context => (
            <Component
              {...this.props}
              {...context}
            />
          )}
        </PointsContextConsumer>
      );
    }
  };
};
