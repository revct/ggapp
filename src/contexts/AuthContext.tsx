import React from 'react';
export interface AuthContextInterface {
  token: null | string;
  setToken: null | ((data: any) => any);
  logout: null | (() => any);
}

export const AuthContext = React.createContext<AuthContextInterface>({
  token: null,
  setToken: null,
  logout: null,
});

export const AuthContextConsumer = AuthContext.Consumer;

export const AuthContextProvider = AuthContext.Provider;

export const withAuthenticated = function(Component: any): any {
  return class WithAuthenticated extends React.PureComponent {
    static navigationOptions = Component.navigationOptions;
    render() {
      return (
        <AuthContextConsumer>
          {auth => <Component {...this.props} auth={auth} />}
        </AuthContextConsumer>
      );
    }
  };
};
