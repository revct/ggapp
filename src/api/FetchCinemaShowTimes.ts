import { ApiClassInterface } from "./Api";
import Axios, { Canceler } from "axios";
import { CINEMAS_API_URL } from "configs/api";
import { BUGSNAG } from "configs/app";
import Logger from "utils/Logger";
const toJson = require('react-native-xml2js').parseString;

/**
 * Single ShowTime Interface
 */
export type ShowTime = {
  extId: string,
  screenId: string,
  seatsSold: string,
  seatsTotal: string,
  time: string,
  feature: {
    ad: 'N' | 'Y',
    extId: string,
    is_3d: 'N' | 'Y',
    perfcat: string,
    perfflags: string,
    subs: 'N' | 'Y',
    title: string,
  }
};

export type ShowTimeRaw = {
  '$': {
    extId: string,
    screenId: string,
    seatsSold: string,
    seatsTotal: string,
    time: string,
  },
  feature: Array<{
    '$': {
      ad: 'N' | 'Y',
      extId: string,
      is_3d: 'N' | 'Y',
      perfcat: string,
      perfflags: string,
      subs: 'N' | 'Y',
      title: string,
    }
  }>
};

interface Response {
  schedule: {
    show: Array<ShowTimeRaw>
  }
}

type Result = Promise<Array<ShowTime>>

class FetchCinemaShowTimes implements ApiClassInterface {

  canceler?: Canceler;

  cancel = () => {
    if (!this.canceler) {
      return;
    }
    this.canceler();
  };

  fetch = async (site: string): Result => {
    const urlParams = ['type=UNIQUE', 'site=' + site];
    return new Promise((resolve, reject) => {
      Axios.get(
        CINEMAS_API_URL + '?' + urlParams.join('&'),
        {
          cancelToken: new Axios.CancelToken(c => this.canceler = c),
          responseType: 'text',
        }
      ).then(({ data }) => {
        toJson(data, (e: Error, result: Response) => {
          if(e) {
            Logger(e)
            return reject(e);
          }
          const parsedresult = parseShowtimes(result.schedule.show);
          return resolve(parsedresult);
        });
      }).catch((e) => {
        Logger(e)
        reject(e);
      });
    });
  };
}

const parseShowtimes = (showTime: Array<ShowTimeRaw>): Array<ShowTime> => {
  return showTime.map((item):ShowTime => {
    return { ...item.$, feature: { ...item.feature[0].$ } };
  });
};

export default FetchCinemaShowTimes;
