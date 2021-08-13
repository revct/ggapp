import React from 'react';
import {BillingInfo, ShippingInfo} from 'api/CreateRestaurantOrder.api';

export interface UserInterface {
  id: number;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  username: string;
  billing: BillingInfo;
  shipping: ShippingInfo;
  is_paying_customer: boolean;
  avatar_url: string;
  meta_data: Array<{
    id: number;
    key: string;
    value: string;
  }>;
}

export interface UserContextInterface {
  user: null | UserInterface;
  setUser: null | ((data: UserInterface) => Promise<UserInterface>);
  removeUser: null | (() => Promise<true>);
}

export const UserContext = React.createContext<UserContextInterface>({
  user: null,
  setUser: null,
  removeUser: null,
});

export const UserContextProvider = UserContext.Provider;

export const UserContextConsumer = UserContext.Consumer;

export const withUser = function(Component: any) {
  return class withUser extends React.PureComponent {
    static navigationOptions = Component.navigationOptions;
    render() {
      return (
        <UserContextConsumer>
          {context => <Component {...this.props} {...context} />}
        </UserContextConsumer>
      );
    }
  };
};
