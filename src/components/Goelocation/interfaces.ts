import { CoordsInfo } from "api/CoordsLookup.api";
import { Coords } from "contexts/GeolocContext";

export interface GeolocationRefApi {
  fetchLocation: () => void,
  setLocation: (location: CoordsInfo) => void,
}

export interface GeolocationProps {
  onlyCoords?: boolean,
  onCoords?: (coords:Coords) => void,
  onGoeloc?: (geoloc: CoordsInfo) => void,
}

export interface GeolocationState {
  isPending: boolean,
  errorMessage: string | null,
}
