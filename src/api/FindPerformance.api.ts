import Axios, {Canceler} from 'axios';
import Logger from 'utils/Logger';
import {asyncGet} from 'utils/Async';
import {STORE_KEYS} from 'configs/async';
import {CINEMAS_API_URL} from 'configs/api';
import {Cinema} from './FetchCinemas';
import {Performance} from './FetchPerformanceList';
import CinemasTokenApi from './CinemasToken.api';

interface ResponseData extends Performance {
  detail?: string;
}

interface Response {
  data: ResponseData;
}

interface Data {
  id: number;
  cinema?: string;
}

type Result = Promise<ResponseData>;

export default async function FindPerformance(
  data: Data,
  configs?: {canceler?: Canceler},
): Result {
  const {cinema} = data || {};
  let site: string | null = cinema || null;
  if (!site) {
    let savedCinema: Cinema = await asyncGet(STORE_KEYS.SELECTED_CINEMA);
    site = savedCinema ? savedCinema.tsite : null;
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
      CINEMAS_API_URL + site + '/performance/' + data.id + '/',
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
