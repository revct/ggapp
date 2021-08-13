import Axios, {Canceler} from 'axios';
import {GOOGLE_API_KEY} from 'configs/api';
import Logger from 'utils/Logger';

type LocationType = string | 'ROOFTOP';

type ViewPorts =
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'northeast'
  | 'southeast'
  | 'southwest'
  | 'northwest';

type AddressComponentTypes =
  | 'street_number'
  | 'route'
  | 'neighborhood'
  | 'political'
  | 'sublocality'
  | 'sublocality_level_1'
  | 'administrative_area_level_2'
  | 'administrative_area_level_1'
  | 'country'
  | 'postal_code';

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: Array<AddressComponentTypes>;
}

interface Geometry {
  location: {
    lat: number;
    lng: number;
  };
  location_type: LocationType;
  viewport: {
    [k in ViewPorts]: {
      lat: number;
      lng: number;
    }
  };
}

export type CoordsInfo = {
  address_components: Array<AddressComponent>;
  formatted_address: string;
  geometry: Geometry;
  place_id: string;
  name: string;
  plus_code?: {
    compound_code: string;
    global_code: string;
  };
  types: Array<string>;
};

interface Response {
  data: {
    plus_code?: {
      compound_code: string;
      global_code: string;
    };
    results?: Array<CoordsInfo>;
    error_message?: string;
    status?: string | 'REQUEST_DENIED' | 'OK';
  };
}

interface Config {
  canceler?: (c: Canceler) => void;
}

interface Data {
  lat: number;
  lng: number;
}

/**
 * Coords look up uses Google Maps Rest API to look up information
 * about a users lat lng location.
 * @param data
 * @param config
 */
export default async function CoordsLookupApi(
  data: Data,
  config: Config,
): Promise<Array<CoordsInfo>> {
  try {
    const response: Response = await Axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json?latlng=' +
        data.lat +
        ',' +
        data.lng +
        '&key=' +
        GOOGLE_API_KEY,
    );
    // stop if API request failed
    if (!response.data) {
      return Promise.reject(new Error('Request to google API failed.'));
    }
    // stop if result is empty
    if (response.data.error_message) {
      Logger(new Error(JSON.stringify(response)));
      return Promise.reject(
        new Error(response.data.error_message || 'Failed to fetch location'),
      );
    }
    return Promise.resolve(
      Array.isArray(response.data.results) ? response.data.results : [],
    );
  } catch (e) {
    return Promise.reject(e);
  }
}
