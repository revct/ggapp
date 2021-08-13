import {Restaurant} from 'api/Restaurants.api';
import React from 'react';

export type CartItemType = 'meal' | 'room' | 'ticket';

export type CartItem = {
  id?: string;
  data: {
    [k: string]: any;
  };
  quantity: number;
  price: number;
  image: string | null;
  name: string;
  caption?: string;
  type: CartItemType;
  location: string;
  restaurant?: Restaurant;
};

export interface CartContextInterface {
  add: ((item: CartItem) => void) | null;
  remove: ((itemId: string | Array<string>, force?: boolean) => void) | null;
  update: ((itemId: string, item: CartItem) => void) | null;
  clear: ((force: boolean) => void) | null;
  items: Array<CartItem>;
  mealsCount: number;
  roomsCount: number;
  ticketsCount: number;
}

export interface IWithCart {
  cart: CartContextInterface;
}

export const CartContext = React.createContext<CartContextInterface>({
  add: null,
  remove: null,
  update: null,
  items: [],
  clear: null,
  mealsCount: 0,
  roomsCount: 0,
  ticketsCount: 0,
});

export const CartcontextProvider = CartContext.Provider;

export const CartcontextConsumer = CartContext.Consumer;

export const withCart = (Component: any) => {
  return class withCart extends React.Component {
    static navigationOptions = Component.navigationOptions;
    render() {
      return (
        <CartcontextConsumer>
          {context => <Component {...this.props} cart={context} />}
        </CartcontextConsumer>
      );
    }
  };
};
