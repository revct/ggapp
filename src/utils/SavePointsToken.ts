import {asyncStore} from './Async';
import {STORE_KEYS} from 'configs/async';

export default async function SavePointsToken(phone: string, token: string) {
  // expires in the next hour
  const expiresAt = new Date().getTime() + 60 * 60 * 1000;
  // save to local storage
  await asyncStore(STORE_KEYS.POINTS_TOKEN.replace('{userId}', phone), {
    token,
    expiresAt,
  });
}
