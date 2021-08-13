import {Cinema} from 'api/FetchCinemas';
import { Coords } from 'contexts/GeolocContext';

export interface CinemaSelectorProps {
  initial?: Cinema | null,
  onChange?: (cinema:Cinema | null) => void,
  coords: Coords | null,
}

export interface CinemaSelectorState {
  isFetching: boolean,
  list: Array<Cinema>,
  error: boolean,
  selected: Cinema | null,
}
