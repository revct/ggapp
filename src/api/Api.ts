import ConfigureWooCommerce from 'utils/WooCommerce';
import {
  RESTAURANT_API_URL,
  RESTAURANT_WOO_COMMERCE_CONSUMER_KEY,
  RESTAURANT_WOO_COMMERCE_CONSUMER_SECRET,
} from 'configs/api';
import {Canceler} from 'axios';

type ApiContentType = 'application/json';

export interface ApiHeaders {
  [k: string]: any;
  Authorization?: string;
  'Content-Type'?: ApiContentType;
  'X-Key'?: string;
}

/**
 * Configured woo commerce object for
 * accessing the restaurant products.
 */
export const RestaurantApi = ConfigureWooCommerce({
  url: RESTAURANT_API_URL,
  consumerKey: RESTAURANT_WOO_COMMERCE_CONSUMER_KEY,
  consumerSecret: RESTAURANT_WOO_COMMERCE_CONSUMER_SECRET,
  version: 'wc/v3',
  wpAPI: true,
  ssl: true,
  queryStringAuth: true,
});

export interface ApiClassInterface {
  canceler?: (() => any) | Canceler;
  cancel: () => void;
  fetch: (param1?: any | number, param2?: any) => Promise<any>;
}
