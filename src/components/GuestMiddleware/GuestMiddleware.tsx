import React from 'react';
import { GuestMiddlewareProps, GuestMiddlewareOptions } from './interfaces';
import { AuthContext } from 'contexts/AuthContext';

export default (Component:any, options:GuestMiddlewareOptions = {allowRedirect: false}) => {
  return class extends React.Component<GuestMiddlewareProps> {
    static contextType?:any = AuthContext;

    timeout?:any;

    componentDidMount() {
      this.handleLeave();
    }

    componentDidUpdate() {
      const {navigation} = this.props;
      if(navigation.isFocused()){
        if(this.timeout){
          clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(this.handleLeave, 800);
      }
    }

    handleLeave = () => {
      const {navigation} = this.props;
      const {token} = this.context;
      if(token && options.allowRedirect && navigation.isFocused()){
        return navigation.navigate('AppStack');
      }
    };

    render() {
      return <Component {...this.props}/>;
    }
  }
}
