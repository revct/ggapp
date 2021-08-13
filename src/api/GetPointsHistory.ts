import Axios, {Canceler} from 'axios';
import Logger from 'utils/Logger';
import GetPointsToken from 'utils/GetPointsToken';

export interface PointsHistoryItem {
  id: string;
  action: 'add' | 'remove';
  actionId: string;
  point: string;
  balance: string;
  createdAt: string;
  updatedAt: string;
}

interface Response {
  data: {
    data: Array<PointsHistoryItem>;
    statusCode: number;
    success: true;
  };
}

type Result = Promise<Array<PointsHistoryItem>>;

export default async function GetPointsHistory(configs?: {
  canceler?: Canceler;
}): Result {
  try {
    const token = await GetPointsToken(configs);
    // get points
    const response: Response = await Axios.get(
      'https://go-backend.genesisgroupng.com/api/v1/history',
      {
        headers: {token: token},
        cancelToken: configs
          ? new Axios.CancelToken(c => (configs.canceler = c))
          : undefined,
      },
    );
    // return a promise resolve with the movies
    return Promise.resolve(response.data.data);
  } catch (e) {
    Logger(e);
    return Promise.reject(e);
  }
}
