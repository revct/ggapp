import {RestaurantApi} from './Api';

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
};

export interface FeaturedMeal {
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
  menu_order: number;
}

type Response = Array<FeaturedMeal>;

export default async function GetFeaturedMealsApi(location): Promise<Response> {
  try {
    const payload = location === 'lagos'?
    {
      per_page:15,
      status:'private',
      featured: true,
      tag: '246',
    }
    :location ==='abuja'?
    {
      per_page: 15,
      status:  'private',
      featured: true,
      tag:"247",
    }
    :location ==='ph'?
    {
      per_page: 15,
      status:'publish',
      featured: true,
        }
    :null

    const response = await RestaurantApi.get('products', payload);
    return Promise.resolve(response);
  } catch (e) {
    return Promise.reject(e);
  }
}
