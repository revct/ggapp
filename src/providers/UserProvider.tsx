import React from 'react';
import {asyncStore, asyncRemove, asyncGet} from 'utils/Async';
import {STORE_KEYS} from 'configs/async';
import {UserInterface, UserContextProvider} from 'contexts/UserContext';
import {sleep} from 'utils/Misc';
import {withCart, CartContextInterface} from 'contexts/CartContext';

interface UserProviderState {
  user: null | UserInterface;
  isReady: boolean;
}

interface UserProviderProps {
  cart: CartContextInterface;
}

class UserProvider extends React.Component<
  UserProviderProps,
  UserProviderState
> {
  state: UserProviderState = {
    user: null,
    isReady: false,
  };

  componentDidMount() {
    this.getUserFromStore();
  }

  async getUserFromStore() {
    const authenticated: UserInterface | null = await asyncGet(
      STORE_KEYS.AUTHENTICATED,
    );
    if (authenticated) {
      return this.setUser(authenticated);
    }
    this.setState({isReady: true});
  }

  setUser = async (user: UserInterface): Promise<UserInterface> => {
    await asyncStore(STORE_KEYS.AUTHENTICATED, user);
    this.setState(() => ({user: user, isReady: true}));
    await sleep(800);
    return Promise.resolve(user);
  };

  removeUser = async (): Promise<true> => {
    const {cart} = this.props;
    await asyncRemove(STORE_KEYS.AUTHENTICATED);
    this.setState(() => ({user: null}));
    await sleep(800);
    if (cart && cart.clear) {
      cart.clear(true);
    }
    return Promise.resolve(true);
  };

  render() {
    const {user, isReady} = this.state;
    if (!isReady) {
      return null;
    }
    return (
      <UserContextProvider
        value={{
          user: user,
          setUser: this.setUser,
          removeUser: this.removeUser,
        }}>
        {this.props.children}
      </UserContextProvider>
    );
  }
}

export default withCart(UserProvider);
