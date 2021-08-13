import {NAIRA_SIGN} from 'configs/app';
import Color from 'color';
import {
  LTP_AMOUNT_BRONZE,
  LTP_AMOUNT_SILVER,
  LTP_AMOUNT_GOLD,
  LTP_PERCENTAGE_BRONZE,
  LTP_PERCENTAGE_SILVER,
  LTP_PERCENTAGE_GOLD,
} from 'configs/loyalty';

/**
 * This will delay actions for the user.
 * @param {number} duration of time meant to sleep.
 * @return promise
 */
export const sleep = (duration: number = 500): Promise<any> => {
  return new Promise(resolve => setTimeout(() => resolve(), duration));
};

/**
 * Pads a given number with a specified amoutn of zeros.
 * @param {number|string} value
 * @param {number} amount
 * @return string
 */
export const padNumber = (
  amount: number | string,
  maxLength: number = 2,
): (() => string) | string => {
  const num = String(amount);
  if (num.length >= maxLength) {
    return num;
  }
  // add zero to number
  amount = `0${amount.toString().trim()}`;
  if (amount.length < maxLength) {
    return padNumber(amount, maxLength);
  }
  // return amount
  return amount;
};

/**
 * Remove leading zeros from a string number.
 * @param {number|string} value
 * @param {number} amount
 * @return string
 */
export const removeLeadingZeros = (
  amount: string,
  minLenth: number = 2,
): (() => string) | string => {
  // check if has leading zeroes
  if (amount.substr(0, 1) === '0') {
    return padNumber(amount.substr(1, amount.length - 1), minLenth);
  }
  // return amount
  return amount;
};

/**
 * Returns a number as a string with thousand commas
 * @param {string|number} num
 * @return string
 */
export const thousand = (amount: string | number) => {
  // convert number to string
  amount = String(amount);
  // return amount string with commas after every three characters
  return amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Displays money amount with currency prefixed to it.
 * @param {int} num
 * @param {string} sign
 * @return string
 */
export const displayAmount = (
  amount: number | string,
  sign: string = NAIRA_SIGN,
): string => {
  // return number string with commas after every three characters
  return `${sign}${thousand(Number(amount).toFixed(0)).trim()}`;
};

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export const getNumberNth = (number: number): string => {
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
};

export const generateRangeArray = (
  start: number,
  end: number,
): Array<number> => {
  const res = [];
  for (let i = start; i <= end; i++) {
    res.push(i);
  }
  return res;
};

export const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];

export const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
];

export function rgba(
  arg1: number | string,
  arg2: number,
  arg3?: number,
  arg4?: number,
) {
  if (arguments.length === 4) {
    let color = [];
    let opacity = 1;
    for (var i = 0; i < arguments.length; i++) {
      if (i >= 3) {
        opacity = arguments[3];
        break;
      }
      color.push(arguments[i]);
    }
    return Color('rgb(' + color.join(',') + ')')
      .fade(Math.abs(opacity !== 1 ? opacity - 1 : 1))
      .toString();
  } else if (arguments.length === 2) {
    return Color(arguments[0])
      .fade(Math.abs(arguments[1] !== 1 ? arguments[1] - 1 : 1))
      .toString();
  } else {
    console.warn(
      'Wrong number of arguments bassed to rgbs function expected two or four arguments.',
    );
    return '';
  }
}

export function darken(color: string, amount: number) {
  return Color(color)
    .darken(amount)
    .hex()
    .toString();
}

export function ucFirst(data: string) {
  data = data.trim();
  if (data.length < 2) {
    return data.toUpperCase();
  }
  return data.substr(0, 1).toUpperCase() + data.substr(1, data.length);
}

export function parseTimeDate(date: string): string {
  const dateSplit = date.split('T');
  if (dateSplit.length < 2) {
    return date;
  }
  const time = dateSplit[1].split(':');
  let ampm = 'am';
  let hour = Number(time[0]);
  let minute = Number(time[1]);
  if (hour - 12 >= 0) {
    hour = hour == 12 ? hour : hour - 12;
    ampm = 'pm';
  }
  return padNumber(hour) + ':' + padNumber(minute) + ampm;
}

export function safeJSONParse(value: any): any {
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
}

export const calcLoyaltyTopupPoint = amount => {
  let newAmount;
  //check if amount is in bronze category
  if (amount >= LTP_AMOUNT_BRONZE && amount < LTP_AMOUNT_SILVER) {
    //assign bronze point
    newAmount = Number(amount) + ((LTP_PERCENTAGE_BRONZE / 100) * amount);
  } else if (amount >= LTP_AMOUNT_SILVER && amount < LTP_AMOUNT_GOLD) {
    newAmount = Number(amount) + Number((LTP_PERCENTAGE_SILVER / 100) * amount);
  } else if (amount >= LTP_AMOUNT_GOLD) {
    newAmount = Number(amount) + Number((LTP_PERCENTAGE_GOLD / 100) * amount);
  } else {
    newAmount = amount;
  }
  return newAmount;
};


export const evaluateLoyaltyPipelineAmount = originalAmount => {
  const amount = calcLoyaltyTopupPoint(Number(originalAmount));
  const resp = Number(amount) * 20;
  console.log(resp);
  return resp;
}