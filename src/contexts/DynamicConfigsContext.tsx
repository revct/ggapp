import React from 'react';
export interface DynamicConfigsContextInterface {
  deliveryFee: number | null;
}

const initial: DynamicConfigsContextInterface = {
  deliveryFee: null,
};

export const DynamicConfigsContext = React.createContext(initial);

export const withDynamiConfig = (Component: any) => {
  return class WithDynamiConfig extends React.Component {
    static navigationOptions = Component.navigationOptions;
    render() {
      return (
        <DynamicConfigsContext.Consumer>
          {context => <Component {...this.props} {...context} />}
        </DynamicConfigsContext.Consumer>
      );
    }
  };
};
