import {CINEMAS_API_URL} from 'configs/api';
import Logger from 'utils/Logger';
import Axios, {Canceler} from 'axios';
import CinemasTokenApi from './CinemasToken.api';

type ResponseData = {
  id: number;
  created: string;
  status: string;
  name: string;
  phone: string;
  email: string;
};

type Response = {
  data: ResponseData;
};

export type NewOrder = ResponseData;

interface BasketAddItem {
  id: number;
  basket_id: number;
  prod_code: string;
  qty: number;
  price: string;
  performance: number;
  seat_numbers: null | string;
  prod_desc: string;
  perf_date: string;
  perf_time: string;
  perf_reserved: string;
  perf_3d: boolean;
  n_seats: number;
  film_desc: string;
  screen_desc: string;
  screen_address: null | string;
  seat_type: string;
  seat_desc: string;
}

export type CinemaOrderLineItem = {
  prod_code: string;
  qty: number;
  performance: number;
};

type Data = {
  name: string;
  email: string;
  phone: string;
  line_items: Array<CinemaOrderLineItem>;
};

interface Result extends ResponseData {
  tickets: Array<BasketAddItem>;
}

export default async function CreateCinemaOrder(
  site: string,
  data: Data,
  configs?: {canceler?: Canceler},
): Promise<Result> {
  let response: Response;
  const tickets = [];
  // site = 'GENAPI';
  try {
    const token = await CinemasTokenApi();
    if (!token.data) {
      throw new Error('Service is unavailabe, please try again in a moment.');
    }
    if (!site) {
      throw new Error('Please select cinema and try again.');
    }
    // create basket
    response = await Axios.post(
      CINEMAS_API_URL + site + '/basket/',
      {...data},
      {
        headers: {Authorization: 'Token ' + token.data},
        timeout: 60 * 6 * 1000,
        cancelToken: configs
          ? new Axios.CancelToken(c => (configs.canceler = c))
          : undefined,
      },
    );

    // response must be an array of meals to pass
    if (typeof response.data.id !== 'number') {
      Logger(new Error(JSON.stringify(response)));
      // return a promise rejection
      return Promise.reject(new Error('Failed to create a new order.'));
    }

    // add all the selected tickets to the basket
    for (let i = 0; i < data.line_items.length; i++) {
      let lineItem = data.line_items[i];
      const item: {data: BasketAddItem} = await Axios.post(
        CINEMAS_API_URL + site + '/basket_item/',
        {
          basket_id: response.data.id,
          prod_code: lineItem.prod_code,
          qty: lineItem.qty,
          performance: lineItem.performance,
        },
        {
          headers: {Authorization: 'Token ' + token.data},
          cancelToken: configs
            ? new Axios.CancelToken(c => (configs.canceler = c))
            : undefined,
        },
      );
      // throw error if failed to add items to order
      if (!item.data.id) {
        Logger(new Error(JSON.stringify(item)), false);
        throw new Error('Failed to add items to new order.');
      }
      // add item to ticket
      tickets.push(item.data);
    }
    return Promise.resolve({...response.data, tickets});
  } catch (e) {
    if (response && response.data && response.data.id) {
      try {
        await Axios.delete(
          CINEMAS_API_URL + site + '/basket/' + response.data.id + '/',
        );
      } catch (err) {
        Logger(err);
      }
    }
    Logger(e);
    return Promise.reject(e);
  }
}
