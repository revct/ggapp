import RemoteConfigApi from './RemoteConfig.api';

export interface SpecialOfferInterface {
  id: number;
  sbu: 'restaurant' | 'cinema' | 'hotel';
  image_url: string;
  variation_id?: number;
}

type Result = Array<SpecialOfferInterface>;

export default async function FetchSpecialOffersApi(): Promise<Result> {
  return new Promise(async (resolve, reject) => {
    try {
      // get snapshot value
      const data = await RemoteConfigApi('special_offers');
      // resolve with special offers list
      resolve(data);
    } catch (e) {
      // reject with error
      reject(e);
    }
  });
}
