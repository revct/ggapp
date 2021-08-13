import React from 'react';
import {AuthMiddlewareProps} from './interfaces';
import {
  AuthContext,
  AuthContextConsumer,
  AuthContextInterface,
} from '../../contexts/AuthContext';
import {UserContextConsumer} from 'contexts/UserContext';

export default (Component: any) => {
  return class AuthMiddleware extends React.Component<AuthMiddlewareProps> {
    static contextType?: any = AuthContext;

    context!: AuthContextInterface;

    timeout?: any;

    componentDidMount() {
      this.handleLeave();
    }

    componentDidUpdate() {
      const {navigation} = this.props;
      if (navigation.isFocused()) {
        if (this.timeout) {
          clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(this.handleLeave, 800);
      }
    }

    handleLeave = () => {
      const {navigation} = this.props;
      const {token} = this.context;
      if (!token && navigation.isFocused()) {
        return navigation.navigate('GuestStack');
      }
    };

    render() {
      return (
        <AuthContextConsumer>
          {auth => (
            <UserContextConsumer>
              {user => (
                <Component
                  {...this.props}
                  token={auth.token}
                  user={user.user}
                  isFetchingUser={user.isFetching}
                  getUser={user.getUser}
                  logout={auth.logout}
                  setUser={user.setUser}
                  resetUser={user.resetUser}
                />
              )}
            </UserContextConsumer>
          )}
        </AuthContextConsumer>
      );
    }
  };
};
