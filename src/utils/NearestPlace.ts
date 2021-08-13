/**
 * Helps get the neares location based on lat lng coordinates.
 *
 * @author Subhendu Kundu
 * @url https://stackoverflow.com/questions/49486641/react-native-find-closest-location-from-user-location#answer-49487023
 */

export type Coords = {
  lat: number,
  lng: number,
};

const deg2Rad = (deg: number) => {
  return deg * Math.PI / 180;
}

function getDistance(latA:number, lngA:number, latB:number, lngB:number):number {
  const earthRadius = 6371000;
  const radiansLAT_A = deg2Rad(latA);
  const radiansLAT_B = deg2Rad(latB);
  const variationLAT = deg2Rad(latB - latA);
  const variationLNG = deg2Rad(lngB - lngA);

  const a = Math.sin(variationLAT/2) * Math.sin(variationLAT/2)
              + Math.cos(radiansLAT_A) * Math.cos(radiansLAT_B) * Math.sin(variationLNG/2) * Math.sin(variationLNG/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  const d = earthRadius * c;

  return d;
}


export default function NearestPlaceIndex(latitude: number, longitude: number, list:Array<Coords>):number {
  let mindif:number|null = null;
  let closest:number = -1;
  for (let i = 0; i < list.length; ++i) {
    const dif = getDistance(latitude, longitude, list[i].lat, list[i].lng);
    // check if difference is less than the farthest
    if (mindif === null || dif < mindif) {
      closest = i;
      mindif = dif;
    }
  };
  return closest;
}
