import Axios, {Canceler} from 'axios';
import Logger from 'utils/Logger';
import GetPointsToken from 'utils/GetPointsToken';

interface Response {
  data: {
    message: string;
    total_points: string;
    statusCode: number;
    success: boolean;
  };
}

type Result = Promise<number>;

export default async function GetTotalPoints(configs: {
  canceler?: Canceler;
}): Result {
  try {
    // get token from async storage
    let token = await GetPointsToken(configs);
    // get points
    const response: Response = await Axios.get(
      'https://go-backend.genesisgroupng.com/api/v1/get-point',
      {
        headers: {
          token: token,
        },
        cancelToken: configs
          ? new Axios.CancelToken(c => (configs.canceler = c))
          : undefined,
      },
    );
    // parse cinemas list to a more resonable object
    const result = Number(response.data.total_points);
    // return a promise resolve with the movies
    return Promise.resolve(result);
  } catch (e) {
    Logger(e);
    return Promise.reject(e);
  }
}
