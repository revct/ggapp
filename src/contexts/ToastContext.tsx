import React from 'react';

export interface ToastContextInterface {
  toast: ((message:string) => void) | null,
}

const initial:ToastContextInterface = {
  toast: null,
};

export const ToastContext = React.createContext(initial);

export const withToast = (Component:any) => {
  return class withToast extends React.Component {
    static navigationOptions = Component.navigationOptions;
    render(){
      return (
        <ToastContext.Consumer>
          {context => (
            <Component
              {...this.props}
              toast={context.toast}
            />
          )}
        </ToastContext.Consumer>
      );
    }
  };
};
