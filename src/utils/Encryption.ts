import {ENCRYPTION_KEY} from '../configs/app';
const CryptoJS = require('crypto-js');
const AES = require('crypto-js/aes');
const MD5 = require('crypto-js/md5');
const UTF8_ENC = require('crypto-js/enc-utf8');

/**
 * Encrypts any given data
 * @param {any} data
 * @return string
 */
export const encrypto = (data: any): string => {
  const key = ENCRYPTION_KEY;
  const iv = ENCRYPTION_KEY.substr(-16);
  return AES.encrypt(JSON.stringify(data), CryptoJS.enc.Utf8.parse(key), {
    iv: CryptoJS.enc.Utf8.parse(iv),
  }).toString();
};

/**
 * Decrypts any system encrypted data
 * @param {string} data
 * @return string
 */
export const decrypto = (data: string): any => {
  const key = ENCRYPTION_KEY;
  const iv = ENCRYPTION_KEY.substr(-16);
  try {
    return JSON.parse(
      AES.decrypt(data, CryptoJS.enc.Utf8.parse(key), {
        iv: CryptoJS.enc.Utf8.parse(iv),
      }).toString(UTF8_ENC),
    );
  }catch(e) {
    return null;
  }
};

/**
 * MD5 encrypt any given string
 * @param {string} data
 * @param {string} key
 * @return string
 */
export const md5 = (data: string): string => {
  return MD5(data).toString();
};

/**
 * This function encodes a given string to base64
 * @param data string
 * @returns string
 */
export function base64Encode(data: string): string {
  const encodedWord = CryptoJS.enc.Utf8.parse(data);
  const encoded = CryptoJS.enc.Base64.stringify(encodedWord);
  return encoded;
}

/**
 * This function decodes a given base64 string
 * @param encodedData string
 * @returns any
 */
export function base64Decode(encodedData: string): any {
  const encodedWord = CryptoJS.enc.Base64.parse(encodedData);
  const decoded = CryptoJS.enc.Utf8.stringify(encodedWord);
  return decoded;
}
