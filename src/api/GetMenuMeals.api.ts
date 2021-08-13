import {RestaurantApi} from './Api';
import Logger from 'utils/Logger';

type MealCategory = {
  id: number;
  name: string;
  slug: string;
};

export type MealImage = {
  id?: number;
  date_created?: string;
  date_created_gmt?: string;
  date_modified?: string;
  date_modified_gmt?: string;
  src: string;
  name?: string;
  alt?: string;
};

export type MealAttribute = {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: Array<string>;
  option?: string;
};

export interface Meal {
  id: number;
  name: string;
  slug: string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  type: string;
  catalog_visibility: 'visible' | 'hidden';
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: null | string;
  date_on_sale_from_gmt: null | string;
  date_on_sale_to: null | string;
  date_on_sale_to_gmt: null | string;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  tax_status: 'taxable' | string;
  tax_class: string;
  manage_stock: false;
  stock_status: 'instock' | string;
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  related_ids: Array<number>;
  upsell_ids: Array<number>;
  cross_sell_ids: Array<number>;
  parent_id: number;
  purchase_note: string;
  categories: Array<MealCategory>;
  tags: Array<string>;
  images: Array<MealImage>;
  attributes: Array<MealAttribute>;
  default_attributes: Array<MealAttribute>;
  variations: Array<number>;
  menu_order: number;
}

type Response = Array<Meal>;

type Data = {
  menuId: string;
  page?: number;
  per_page?: number;
  location:string;
};

export default async function GetMenuMeals(data: Data): Promise<Response> {
  try {
    const payload = data.location === 'lagos'?
    {
      per_page: data.per_page || 100,
      status:'private',
      category: data.menuId,
      page: data.page,
      tag: '246',
    }
    :data.location ==='abuja'?
    {
      per_page: data.per_page || 100,
      status:  'private',
      category: data.menuId,
      page: data.page,
      tag:"247",
    }
    :data.location ==='ph'?
    {
      per_page: data.per_page || 100,
      status:'publish',
      category: data.menuId,
      page: data.page,
    }
    :null
    const response = await RestaurantApi.get('products', payload);
    // response must be an array of meals to pass
    if (!Array.isArray(response)) {
      Logger(new Error(JSON.stringify(response)));
      // return a promise rejection
      return Promise.reject(new Error('Failed to fetch the menu.'));
    }
    return Promise.resolve(response);
  } catch (e) {
    return Promise.reject(e);
  }
}
