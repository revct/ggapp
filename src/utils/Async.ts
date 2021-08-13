import AsyncStorage from '@react-native-community/async-storage';
import {STORE_NAME} from '../configs/async';
import {encrypto, decrypto} from './Encryption';

/**
 * Saves data to the async store
 * @param {string} key
 * @param {any} data
 * @return promise
 */
export const asyncStore = async function(key:string, data:any): Promise<any> {
  return await AsyncStorage.setItem(STORE_NAME + key, encrypto(data));
};

/**
 * Gets saved data from the async store
 * @param {string} key
 * @return promise
 */
export const asyncGet = async function(key:string):Promise<any> {
  // get data from the async storage
  var data = await AsyncStorage.getItem(STORE_NAME + key);
  // only decrypt data if found
  if (data !== undefined && data !== null) {
    data = decrypto(data);
  }
  // return data
  return data;
};

/**
 * Removes saved data from the async store
 * @param {string} key
 * @return Promise
 */
export const asyncRemove = async function(key:string):Promise<any> {
  return await AsyncStorage.removeItem(STORE_NAME + key);
};
