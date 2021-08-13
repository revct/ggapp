import Axios, {Canceler} from 'axios';
import Logger from 'utils/Logger';
import {asyncGet} from 'utils/Async';
import {STORE_KEYS} from 'configs/async';
import {CINEMAS_API_URL} from 'configs/api';
import {Cinema} from './FetchCinemas';
import CinemasTokenApi from './CinemasToken.api';

export interface Performance {
  id: number;
  perfdate: string;
  start_time: string;
  use_seat_plan: 'N' | 'Y';
  stop_selling: 'N' | 'Y';
  use_levels: 'N' | 'Y';
  warning_level: number;
  managers_level: number;
  flags: string;
  has_ad: 'N' | 'Y';
  has_subs: 'N' | 'Y';
  film: {
    id: number;
    title: string;
    certificate: {
      id: string;
      description: string;
      restriction_text: string;
    };
    runtime: number;
    film_number: number;
    trailertime: number;
    censor_advice: string;
    is_3d: 'N' | 'Y';
    is_digital: 'N' | 'Y';
    synopsis: string;
    flags: string;
    imageurl: 'n/a' | string | null;
  };
  screen: {
    id: number;
    description: string;
    warning_level: number;
    managers_level: number;
    has_vpf: 'N' | 'Y';
    wchair_access: 'N' | 'Y';
    prompt_for_3d_glasses: 'N';
    scrpos: any;
  };
  category: {
    id: string;
    description: string;
  };
  timeslot: {
    id: string;
    description: string;
    start_time: string;
    warning_time: string;
    booking_starts: string;
    booking_ends: string;
  };
  free_seats: number;
}


export interface Film {
  id: number;
  title: string;
  certificate: {
    id: string;
    description: string;
    restriction_text: string;
  };
  runtime: number;
  film_number: number;
  trailertime: number;
  censor_advice: string;
  is_3d: 'N' | 'Y';
  is_digital: 'N' | 'Y';
  synopsis: string;
  flags: string;
  imageurl: 'n/a' | string | null;
}

interface ResponseData {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<Performance>;
}

interface Response {
  data: ResponseData;
}

interface Data {
  page?: number;
  film__id?: number;
  perfdate?: string;
  cinema?: string;
}

type Result = Promise<ResponseData>;

export default async function FetchPerformanceList(
  data?: Data,
  configs?: {canceler?: Canceler},
): Result {
  const {cinema} = data || {};
  let site: string | null = cinema || null;
  if (!site) {
    let savedCinema: Cinema = await asyncGet(STORE_KEYS.SELECTED_CINEMA);
    site = savedCinema ? savedCinema.tsite : null;
  }
  let queryParams: string | Array<string> = [];
  if (data) {
    const dataKeys: Array<string> = Object.keys(data);
    for (let i = 0; i < dataKeys.length; i++) {
      if (!data[dataKeys[i]] || dataKeys[i] === 'cinema') {
        continue;
      }
      queryParams.push(dataKeys[i] + '=' + data[dataKeys[i]]);
    }
    if (queryParams.length) {
      queryParams = '?' + queryParams.join('&');
    } else {
      queryParams = '';
    }
  }
  try {
    // enforce development api
    // site = 'GENAPI';
    const token = await CinemasTokenApi();
    if (!token.data) {
      throw new Error('Service is unavailabe, please try again in a moment.');
    }

    // the site is required
    if (!site) {
      throw new Error('Please select a cinema and try again.');
    }

    // get points
    const response: Response = await Axios.get(
      CINEMAS_API_URL + site + '/performance_noseats/' + queryParams,
      // CINEMAS_API_URL + site + '/performance' + queryParams,
      {
        headers: {Authorization: 'Token ' + token.data},
        timeout: 60 * 6 * 1000,
        cancelToken: configs
          ? new Axios.CancelToken(c => (configs.canceler = c))
          : undefined,
      },
    );
    // return a promise resolve with the movies
    return Promise.resolve(response.data);
  } catch (e) {
    Logger(e);
    return Promise.reject(e);
  }
}
