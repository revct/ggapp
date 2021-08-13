import { ApiClassInterface } from "./Api";
import Axios, { Canceler, CancelToken } from "axios";
import { CINEMAS_API_URL } from "configs/api";
import { BUGSNAG } from "configs/app";
import { padNumber } from "utils/Misc";
import Logger from "utils/Logger";

/**
 * Single Film Interface
 */
export interface Film {
  www: string,
  code: string,
  ft: string,
  pdict: { [k: string]: any },
  img: string,
  youtube: null | string,
  syn: string,
  cat: string,
  fcode: number,
  p: Array<{
    dt: string,
    fst: Array<{
      tm: string,
      flags: Array<string>,
      id: number,
      flags_description: Array<string>
    }>
  }>,
  cert: string,
  is_3d: "N" | "Y",
  rel: string,
  bbfc: string,
  cs: "N" | "Y",
  run: number,
  certcode: "PG" | string,
  st: string,
  catcode: string,
  id: string,
  rating?: number,
  price?: number,
  reward?: number,
  points?: number,
};

interface Response {
  data: {
    filmintheatres: Array<{ films: Array<{ film: Film }> }>
  }
}

export type FilmSchedules = Array<{
  date: string,
  films: Array<Film>
}>;

type Result = Promise<{
  featured: Array<Film>,
  schedules: FilmSchedules,
}>

class FetchFilms implements ApiClassInterface {

  canceler?: Canceler;

  cancel = () => {
    if (!this.canceler) {
      return;
    }
    this.canceler();
  };

  fetch = async (): Result => {
    const urlParams = ['type=APP', 'cust=GENLAG', 'd=p'];
    try {
      // get films
      const response: Response = await Axios.get(
        CINEMAS_API_URL + '?' + urlParams.join('&'),
        { cancelToken: new Axios.CancelToken(c => this.canceler = c) }
      );
      // parse films list to a more resonable object
      const result = parseFilms(response.data.filmintheatres);
      // return a promise resolve with the movies
      return Promise.resolve({
        featured: featuredFilms(result),
        schedules: filmSchedules(result),
      });
    } catch (e) {
      Logger(e);
      return Promise.reject(e);
    }
  };
}

const featuredFilms = (films: Array<Film>): Array<Film> => {
  // create result container
  const res: Array<Film> = [];
  // loop through the films
  for (let i = 0; i < films.length; i++) {
    // stop if already has 5 items
    if (res.length >= 5) {
      break;
    }
    // skip if already exists
    if (res.findIndex(item => item.ft === films[i].ft) !== -1) {
      continue;
    }
    // add film to result
    res.push(films[i]);
  }
  // return result
  return res;
}

const filmSchedules = (films: Array<Film>): FilmSchedules => {
  // 24 hours mili seconds
  const twentyFourHoursMs = 86400000;
  // get schedule days
  const today = new Date();
  const tomorrow = new Date(today.getTime() + twentyFourHoursMs);
  const nextTomorrow = new Date(tomorrow.getTime() + twentyFourHoursMs);
  const fourthDay = new Date(nextTomorrow.getTime() + twentyFourHoursMs);
  // create result container
  const res: FilmSchedules = [
    {
      date: 'Today',
      films: getScheduleFilms(
        films,
        `${today.getFullYear()}-${padNumber(today.getMonth() + 1)}-${padNumber(today.getDate())}`
      ),
    },
    {
      date: 'Tomorrow',
      films: getScheduleFilms(
        films,
        `${tomorrow.getFullYear()}-${padNumber(tomorrow.getMonth() + 1)}-${padNumber(tomorrow.getDate())}`
      ),
    },
    {
      date: `${DAYS[nextTomorrow.getDay()]} ${getNumberNth(nextTomorrow.getDate())}`,
      films: getScheduleFilms(
        films,
        `${nextTomorrow.getFullYear()}-${padNumber(nextTomorrow.getMonth() + 1)}-${padNumber(nextTomorrow.getDate())}`
      ),
    },
    {
      date: `${DAYS[fourthDay.getDay()]} ${getNumberNth(fourthDay.getDate())}`,
      films: getScheduleFilms(
        films,
        `${fourthDay.getFullYear()}-${padNumber(fourthDay.getMonth() + 1)}-${padNumber(fourthDay.getDate())}`
      ),
    },
  ];
  // return result
  return res;
}

const getScheduleFilms = (films: Array<Film>, date: string): Array<Film> => {
  const res: Array<Film> = [];
  // loop through the films list
  for (let i = 0; i < films.length; i++) {
    // skip if film is already in the result list
    if (res.find(item => item.st === films[i].st)) {
      continue;
    }
    // skip if film is not showing on passed data
    if (films[i].p.findIndex(item => item.dt === date) === -1) {
      continue;
    }
    // push film to result list
    res.push(films[i]);
  }
  // return a result of films array
  return res;
}

const parseFilms = (films: Array<{ films: Array<{ film: Film }> }>): Array<Film> => {
  const res: Array<Film> = [];
  films.forEach(item => {
    if (item.films) {
      item.films.forEach(item => {
        res.push(item.film);
      });
    }
  });
  return res;
};

const getNumberNth = (number: number): string => {
  const numberString = String(number);
  switch (numberString.substr(-1, 1)) {
    case '1':
      return number + 'st';
    case '2':
      return number + 'nd';
    case '3':
      return number + 'rd';
    default:
      return number + 'th';
  }
}

const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export default FetchFilms;
