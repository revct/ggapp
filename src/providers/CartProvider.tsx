import React from 'react';
import {CartcontextProvider, CartItem} from 'contexts/CartContext';
import {Alert} from 'react-native';
import isEqual from 'lodash/isEqual';
import {withToast} from 'contexts/ToastContext';

export interface CartProviderState {
  items: Array<CartItem>;
}

export interface CartProviderProps {
  toast: (message: string) => void;
}

class CartProvider extends React.Component<
  CartProviderProps,
  CartProviderState
> {
  state: CartProviderState = {
    items: [],
  };

  addItem = (item: CartItem) => {
    switch (item.type) {
      case 'meal':
        return this.addMeal(item);
      case 'ticket':
        return this.addTicket(item);
      case 'room':
        return this.addRoom(item);
      default:
        return;
    }
  };

  addMeal(item: CartItem) {
    // this only adds tickets
    if (item.type !== 'meal') {
      return;
    }
    const {items} = this.state;
    // get item if it exists by name and type
    const exists = items.find(
      i => i.name === item.name && i.type === item.type,
    );
    // update item quantity if same item and configs exists
    if (
      exists &&
      isEqual(item.data.deliveryLocation, exists.data.deliveryLocation) &&
      isEqual(item.data.variation, exists.data.variation) &&
      item.location === exists.location
    ) {
      exists.quantity = exists.quantity + item.quantity;
      // update cart items
      if (exists.id) {
        this.updateItem(exists.id, exists);
        this.props.toast('Added to cart "' + item.name + '"');
        return;
      }
    }
    // add the new item if not found
    this.setState(({items}) => {
      items.unshift({...item, id: this.generateItemId()});
      return {items};
    });
    this.props.toast('Added to cart "' + item.name + '".');
  }

  addTicket(item: CartItem) {
    // this only adds tickets
    if (item.type !== 'ticket') {
      return;
    }
    const {items} = this.state;
    // get item if it exists by name and type
    const exists = items.find(
      i => i.data.id === item.data.id && i.type === item.type,
    );
    // update item quantity if same item and configs exists
    if (exists && exists.location === item.location) {
      exists.quantity = exists.quantity + item.quantity;
      // update cart items
      if (exists.id) {
        this.updateItem(exists.id, exists);
        this.props.toast('Added to cart "' + item.name + '".');
        return;
      }
    }
    // add the new item if not found
    this.setState(state => {
      state.items.unshift({...item, id: this.generateItemId()});
      return {items};
    });
    this.props.toast('Added to cart "' + item.name + '".');
  }

  addRoom(item: CartItem) {
    // this only adds tickets
    if (item.type !== 'room') {
      return;
    }
    const {items} = this.state;
    // get item if it exists by name and type
    const exists = items.find(
      i =>
        i.data.code === item.data.code &&
        i.type === item.type &&
        i.data.arrival === item.data.arrival &&
        i.data.departure === item.data.departure,
    );
    // update item quantity if same item and configs exists
    if (exists && exists.location === item.location) {
      if (exists.data.units < exists.quantity + item.quantity) {
        return this.props.toast('Maximum units reached.');
      }
      exists.quantity = exists.quantity + item.quantity;
      // update cart items
      if (exists.id) {
        this.updateItem(exists.id, exists);
        this.props.toast('Added to cart "' + item.name + '".');
        return;
      }
    }
    // add the new item if not found
    this.setState(state => {
      items.unshift({...item, id: this.generateItemId()});
      return {items: state.items};
    });
    this.props.toast('Added to cart "' + item.name + '".');
  }

  generateItemId = (): string => {
    return 'CRTITM' + Math.random() * 1000 + '/' + new Date().getTime();
  };

  removeItem = (itemId: string | Array<string>, force: boolean = false) => {
    if (force) {
      return this.removeAction(itemId);
    }
    Alert.alert('Remove From Cart', 'Are you sure you want to do this?', [
      {text: 'No'},
      {
        text: 'Yes, Remove Item',
        onPress: () => this.removeAction(itemId),
        style: 'destructive',
      },
    ]);
  };

  removeAction = (itemId: string | Array<string>) => {
    const {items} = this.state;
    this.setState({
      items: items.filter(item => {
        if (!item.id) {
          return false;
        }
        if (Array.isArray(itemId)) {
          return (
            itemId.findIndex(i => i.trim() === String(item.id).trim()) === -1
          );
        }
        return String(item.id).trim() !== String(itemId).trim();
      }),
    });
  };

  clearCart = (force: boolean = false): any => {
    if (!force) {
      return Alert.alert('Clear Cart', 'Are you sure you want to do this?', [
        {text: 'No'},
        {text: 'Yes, Clear Cart', onPress: () => this.clearCart(true)},
      ]);
    }
    this.setState({items: []});
  };

  updateItem = (itemId: string, update: CartItem) => {
    this.setState(({items}) => ({
      items: items.map(item => {
        if (item.id !== itemId) {
          return item;
        }
        return {...item, ...update};
      }),
    }));
  };

  render() {
    const {children} = this.props;
    const {items} = this.state;
    return (
      <CartcontextProvider
        value={{
          add: this.addItem,
          remove: this.removeItem,
          update: this.updateItem,
          items: items,
          clear: this.clearCart,
          mealsCount: items.filter(i => i.type === 'meal').length,
          roomsCount: items.filter(i => i.type === 'room').length,
          ticketsCount: items.filter(i => i.type === 'ticket').length,
        }}>
        {children}
      </CartcontextProvider>
    );
  }
}

export default withToast(CartProvider);
