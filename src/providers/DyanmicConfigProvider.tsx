import React from 'react';
import {DynamicConfigsContext} from 'contexts/DynamicConfigsContext';
import FetchDeliveryFeeApi from 'api/FetchDeliveryFee.api';
import Logger from 'utils/Logger';

interface DynamicConfigsProviderState {
  deliveryFee: number | null;
}

interface DynamicConfigsProviderProps {}

export default class DynamicConfigsProvider extends React.Component<
  DynamicConfigsProviderProps,
  DynamicConfigsProviderState
> {
  state: DynamicConfigsProviderState = {
    deliveryFee: null,
  };

  timeout: any;

  mounted: boolean = false;

  componentDidMount() {
    this.mounted = true;
    this.fetch();
  }

  componentWillUnmount() {
    this.mounted = false;
    clearTimeout(this.timeout);
  }

  fetch = async () => {
    if (!this.mounted) {
      return;
    }
    try {
      const deliveryFee = await FetchDeliveryFeeApi();
      if (!this.mounted) {
        return;
      }
      if (typeof deliveryFee !== 'number') {
        const err = new TypeError('Delivery fee is not a number.');
        Logger(err);
        throw err;
      }
      this.setState({deliveryFee: deliveryFee});
    } catch (e) {
      if (!this.mounted) {
        return;
      }
      this.timeout = setTimeout(this.fetch, 10000);
    }
  };

  render() {
    const {deliveryFee} = this.state;
    return (
      <DynamicConfigsContext.Provider
        value={{
          deliveryFee: typeof deliveryFee === 'number' ? deliveryFee : 500,
        }}>
        {this.props.children}
      </DynamicConfigsContext.Provider>
    );
  }
}
