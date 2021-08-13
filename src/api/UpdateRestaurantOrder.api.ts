import { RestaurantApi } from './Api';
import { BUGSNAG } from 'configs/app';
import Logger from 'utils/Logger';

type Response = {
  "id": number,
  "parent_id": number,
  "number": string,
  "order_key": string,
  "created_via": string,
  "version": string,
  "status": string,
  "currency": string,
  "date_created": string,
  "date_created_gmt": string,
  "date_modified": string,
  "date_modified_gmt": string,
  "discount_total": string,
  "discount_tax": string,
  "shipping_total": string,
  "shipping_tax": string,
  "cart_tax": string,
  "total": string,
  "total_tax": string,
  "prices_include_tax": boolean,
  "payment_method": string,
  "payment_method_title": string,
  "transaction_id": string,
  "date_paid": string,
  "date_paid_gmt": string,
  "date_completed": null | string,
  "date_completed_gmt": null | string,
}

export type NewOrder = Response;

type BillingInfo = {
  first_name: string,
  last_name: string,
  address_1: string,
  address_2?: string,
  city: string,
  state: string,
  postcode?: string,
  country: string,
  email: string,
  phone: string
};

type ShippingInfo = {
  first_name: string,
  last_name: string,
  address_1: string,
  address_2?: string,
  city: string,
  state: string,
  postcode: string,
  country: string
};

type ShippingLine = {
  method_id: string,
  method_title: string,
  total: string
}

export type RestaurantNewOrderLineItem = {
  product_id: number,
  variation_id?: number,
  quantity: number
}

type Data = {
  payment_method?: string,
  payment_method_title?: string,
  set_paid?: boolean,
  billing?: BillingInfo,
  shipping?: ShippingInfo,
  line_items?: Array<RestaurantNewOrderLineItem>,
  shipping_lines?: Array<ShippingLine>,
  transaction_id: string,
};

export default async function UpdateRestaurantOrder(id:number, data:Data): Promise<Response> {
  try {
    const response:Response = await RestaurantApi.put('orders/' + id, data);
    // response must be an array of meals to pass
    if(typeof response.id !== 'number'){
      Logger(new Error(JSON.stringify(response)));
      // return a promise rejection
      return Promise.reject(new Error('Failed to update order.'));
    }
    return Promise.resolve(response);
  } catch (e) {
    return Promise.reject(e);
  }
};
