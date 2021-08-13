import {ApiClassInterface} from './Api';
import Axios, {Canceler} from 'axios';
import Logger from "utils/Logger";

/**
 * Single Cinema Interface
 */
export type Cinema = {
  a: string;
  c: string;
  code: string;
  d: string;
  tsite: string;
  country: string;
  voucherinfo_gchaspin: null | string;
  pos: string;
  long: number;
  lat: number;
  timezone: string;
  facilities: string;
  s: string;
  gccode: null | number | string;
  t: string;
  gcpin: null | string;
  mno: null | string;
  voucherinfo_gccode: null | string;
  tno: string;
  z: null | string;
  booking_url: string;
};

interface Response {
  data: {
    theatres: Array<{theatre: Cinema}>;
  };
}

type Result = Promise<Array<Cinema>>;

class FetchCinemas implements ApiClassInterface {
  canceler?: Canceler;

  cancel = () => {
    if (!this.canceler) {
      return;
    }
    this.canceler();
  };

  fetch = async (): Result => {
    try {
      // get cinemas
      const response: Response = await Axios.get(
        'http://roemeo.com/xml/pfapache.py?type=SITEINFO&cust=GENLAG&d=p',
        {cancelToken: new Axios.CancelToken(c => (this.canceler = c))},
      );
      // parse cinemas list to a more resonable object
      const result = parseCinemas(response.data.theatres);
      // return a promise resolve with the movies
      return Promise.resolve(result);
    } catch (e) {
      Logger(e);
      return Promise.reject(e);
    }
  };
}

const parseCinemas = (cinemas: Array<{theatre: Cinema}>): Array<Cinema> => {
  const res: Array<Cinema> = [];
  cinemas.forEach(item => {
    if (item.theatre) {
      res.push(item.theatre);
    }
  });
  return res;
};

export default FetchCinemas;
