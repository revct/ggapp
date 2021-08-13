import {asyncGet} from './Async';
import {STORE_KEYS} from 'configs/async';
import {md5} from './Encryption';
import PointsAuthenticate from 'api/PointsAuthenticate';
import SavePointsToken from './SavePointsToken';
import {Canceler} from 'axios';
import {UserInterface} from 'contexts/UserContext';

export default async function GetPointsToken(configs?: {
  canceler?: Canceler;
  new?: boolean;
}): Promise<string> {
  try {
    // get token from async storage
    let user: UserInterface = await asyncGet(STORE_KEYS.AUTHENTICATED);
    if (!user) {
      return Promise.reject(new Error('Logging in is required.'));
    }
    if (!user.billing.phone) {
      return Promise.reject(
        new Error('Your phone number is missing from your profile.'),
      );
    }
    // get token from async storage
    let token = await asyncGet(
      STORE_KEYS.POINTS_TOKEN.replace('{userId}', md5(String(user.id))),
    );
    // get new token if current one has expires
    if (
      !token ||
      !token.token ||
      token.expiresAt < new Date().getTime() ||
      (configs && configs.new)
    ) {
      // request new token
      token = await PointsAuthenticate(
        {
          phoneNumber: user.billing.phone.replace(/\s/g, '').replace(/\+/, ''),
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
        },
        configs,
      );
      // save new token locally
      await SavePointsToken(String(user.id), token.token);
    }
    return Promise.resolve(token.token);
  } catch (e) {
    return Promise.reject(e);
  }
}
