import React from 'react';
import LiveChatContext from 'contexts/LiveChatContext';
import LiveChat from 'components/LiveChat/LiveChat';

interface LiveChatProviderState {
  isVisible: boolean;
}

interface LiveChatProviderProps {}

export default class LiveChatProvider extends React.Component<
  LiveChatProviderProps,
  LiveChatProviderState
> {
  state: LiveChatProviderState = {
    isVisible: false,
  };

  timeout: any;

  mounted: boolean = false;

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
    clearTimeout(this.timeout);
  }

  show = () => {
    this.setState({isVisible: true});
  };

  dismiss = () => {
    this.setState({isVisible: false});
  };

  render() {
    const {isVisible} = this.state;
    return (
      <LiveChatContext.Provider
        value={{
          show: this.show,
          dismiss: this.dismiss,
        }}>
        {this.props.children}
        <LiveChat show={isVisible} />
      </LiveChatContext.Provider>
    );
  }
}
