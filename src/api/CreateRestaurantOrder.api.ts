import {RestaurantApi} from './Api';
import Logger from 'utils/Logger';

type Response = {
  id: number;
  parent_id: number;
  number: string;
  order_key: string;
  created_via: string;
  version: string;
  status: string;
  currency: string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  prices_include_tax: boolean;
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  date_paid: string;
  date_paid_gmt: string;
  date_completed: null | string;
  date_completed_gmt: null | string;
};

export type NewOrder = Response;

export type BillingInfo = {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  company?: string;
  city: string;
  state: string;
  postcode?: string;
  country: string;
  email: string;
  phone: string;
};

export type ShippingInfo = {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
};

type ShippingLine = {
  method_id: string;
  method_title: string;
  total: string;
};

export type RestaurantNewOrderLineItem = {
  product_id: number;
  variation_id?: number;
  quantity: number;
};

type Data = {
  payment_method?: string;
  payment_method_title?: string;
  set_paid: boolean;
  billing: BillingInfo;
  shipping: ShippingInfo;
  line_items: Array<RestaurantNewOrderLineItem>;
  shipping_lines: Array<ShippingLine>;
  customer_id: number;
  customer_note: string;
  status:
    | 'pending'
    | 'cancelled'
    | 'refunded'
    | 'failed'
    | 'pending-payment'
    | 'processing'
    | 'on-hold'
    | 'on-the-way'
    | 'completed';
};

export default async function CreateRestaurantOrder(
  data: Data,
): Promise<Response> {
  try {
    const response: Response = await RestaurantApi.post('orders', {...data});
    // response must be an array of meals to pass
    if (typeof response.id !== 'number') {
      Logger(new Error(JSON.stringify(response)));
      // return a promise rejection
      return Promise.reject(
        new Error(response.message || 'Failed to create a new order.'),
      );
    }
    return Promise.resolve(response);
  } catch (e) {
    Logger(e);
    return Promise.reject(e);
  }
}
