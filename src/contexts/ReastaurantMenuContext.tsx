import React from 'react';

export interface RestaurantMenu {
  id: number,
  count: number,
  description: string,
  display: string,
  image: {
    id: number,
    name: string,
    src: string,
  },
  menu_order: 0,
  name: string,
  parent: number,
  slug: string,
};

export interface RestaurantMenuContextInterface {
  setList: ((list:Array<RestaurantMenu>) => void) | null,
  clearList: (() => void) | null,
  list: Array<RestaurantMenu>,
}

const initial:RestaurantMenuContextInterface = {
  setList: null,
  clearList: null,
  list: []
};

export const RestaurantMenuContext = React.createContext(initial);

export const RestaurantMenuContextProvider = RestaurantMenuContext.Provider;

export const RestaurantMenuContextConsumer = RestaurantMenuContext.Consumer;

export const withRestaurantMenu = (Component:any) => {
  return class withRestaurantMenu extends React.PureComponent {
    static navigationOptions = Component.navigationOptions;
    render() {
      return (
        <RestaurantMenuContextConsumer>
          {menu => (
            <Component
              {...this.props}
              restaurantMenu={{
                set: menu.setList,
                clear: menu.clearList,
                list: menu.list,
              }}
            />
          )}
        </RestaurantMenuContextConsumer>
      );
    }
  }
}
