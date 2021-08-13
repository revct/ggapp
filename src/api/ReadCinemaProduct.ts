import Axios, {Canceler} from 'axios';
import Logger from 'utils/Logger';
import {CINEMAS_API_URL} from 'configs/api';
import CinemasTokenApi from './CinemasToken.api';

export interface PerformanceReadItem {
  code: string;
  description: string;
  unit_price: string;
  discounted_price: string;
  mixed_reserved: boolean;
  nseats: number;
  seattype: string;
  valid_desc: string;
}

type ResponseData = Array<PerformanceReadItem>;

interface Response {
  data: ResponseData;
}

type Result = Promise<PerformanceReadItem>;

export default async function ReadCinemaProduct(
  data: {performanceId: number; site: string},
  configs?: {canceler?: Canceler},
): Result {
  const {performanceId, site} = data;
  if (!site) {
    throw new Error('Please select a cinema an try again.');
  }
  try {
    const token = await CinemasTokenApi();
    if (!token.data) {
      throw new Error('Service is unavailabe, please try again in a moment.');
    }
    // get points
    const response: Response = await Axios.get(
      CINEMAS_API_URL + site + '/products/' + performanceId + '/',
      {
        headers: {Authorization: 'Token ' + token.data},
        timeout: 60 * 6 * 1000,
        cancelToken: configs
          ? new Axios.CancelToken(c => (configs.canceler = c))
          : undefined,
      },
    );
    // return a promise resolve with the movies
    return Promise.resolve(response.data[0]);
  } catch (e) {
    Logger(e);
    return Promise.reject(e);
  }
}
