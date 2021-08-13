import React from 'react';

interface LiveChatContextInterface  {
  show: (() => void) | null,
  dismiss: (() => void) | null,
}

const initial:LiveChatContextInterface = {
  show: null,
  dismiss: null,
};

const LiveChatContext = React.createContext(initial);

export const withLiveChat = (Component:any) => {
  return class withLiveChat extends React.Component {
    static navigationOptions = Component.navigationOptions;
    render() {
      return (
        <LiveChatContext.Consumer>
          {context => (<Component {...this.props} liveChat={context} />)}
        </LiveChatContext.Consumer>
      );
    }
  }
}

export default LiveChatContext;
