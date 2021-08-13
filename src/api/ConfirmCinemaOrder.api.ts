import {CINEMAS_API_URL} from 'configs/api';
import Logger from 'utils/Logger';
import Axios, {Canceler} from 'axios';
import CinemasTokenApi from './CinemasToken.api';

interface ResponseData {
  date: string;
  status: 'F' | 'S' | 'P';
  description: string;
  transaction_code: null | string;
  booking_ref: null | string;
}

type Response = {
  data: ResponseData;
};

interface Result extends ResponseData {}

export default async function ConfirmCinemaOrder(
  site: string,
  id: number,
  configs?: {canceler?: Canceler},
): Promise<Result> {
  try {
    const token = await CinemasTokenApi();
    if (!token.data) {
      throw new Error('Service is unavailabe, please try again in a moment.');
    }
    // site = 'GENAPI';
    if (!site) {
      throw new Error('Please select a cinema and try again.');
    }

    // create basket
    const response: Response = await Axios.post(
      CINEMAS_API_URL + site + '/basket/' + id + '/confirm_and_wait/',
      {},
      {
        headers: {Authorization: 'Token ' + token.data},
        timeout: 60 * 6 * 1000,
        cancelToken: configs
          ? new Axios.CancelToken(c => (configs.canceler = c))
          : undefined,
      },
    );

    // response must be an array of meals to pass
    if (response.data.status === 'F') {
      Logger(new Error(JSON.stringify(response)));
      // return a promise rejection
      return Promise.reject(
        new Error(response.data.description || 'Failed to confirm order.'),
      );
    }

    return Promise.resolve(response.data);
  } catch (e) {
    Logger(e);
    return Promise.reject(e);
  }
}
