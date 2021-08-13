import WooCommerceAPI from 'react-native-woocommerce-api';

/**
 * Woo response interface.
 */
type WooResponse = any;

/**
 * Quesry parameters used to configure the request.
 */
interface WooQueryParams {
  [k:string]: any
}

/**
 * Request data
 */
interface  WooRequestData {
  [k:string]: any
}

/**
 * Get Questy param interface, this is meant to make available the
 * possible options that can be passed when making a get request.
 */
interface WooGetQueryParams extends WooQueryParams{
  per_page?: number,
  status: 'any' | 'draft' | 'pending' | 'private' | 'publish',
  stock_status?: 'instock' | 'outofstock' | 'onbackorder',
  featured?: boolean,
  category?: string
}

/**
 * Delete query params, this is meant to help tell the
 */
interface WooDeleteQueryParams extends WooQueryParams{
  force?: boolean
}

/**
 * An instance of the WooCommerce Rest API class,
 * this makes certain functions available for use.
 */
interface WooCommerceRestApiInstance {
  get: (endpoint:string, params?:WooGetQueryParams) => WooResponse,
  post: (endpoint:string, data:WooRequestData, params?:WooQueryParams) => WooResponse,
  put: (endpoint:string, data:WooRequestData, params?:WooQueryParams) => WooResponse,
  delete: (endpoint:string, params?:WooDeleteQueryParams) => WooResponse,
}

/**
 * Confiration options for WooCommerce
 */
interface WooCommerceRestApiOptions {
  url: string,
  consumerKey: string,
  consumerSecret: string,
  wpAPI?:boolean,
  wpAPIPrefix?:string,
  version?:string,
  verifySsl?: boolean,
  encoding?: string,
  queryStringAuth?: boolean,
  port?: string,
  timeout?: number,
  agent?: any,
  ssl: boolean,
}

/**
 * Creates an instance of the WooCommerceRestApi object
 * with the options passed.
 *
 * @param options WooCommerceRestApiOptions
 */
export default function ConfigureWooCommerce(options:WooCommerceRestApiOptions):WooCommerceRestApiInstance {
  return new WooCommerceAPI(options);
}
