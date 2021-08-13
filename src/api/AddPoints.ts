import Axios, {Canceler} from 'axios';
import Logger from 'utils/Logger';
import GetPointsToken from 'utils/GetPointsToken';

interface Response {
  data: {
    message: string;
    data: {
      total_points: string;
      point: number;
    };
    statusCode: number;
    success: true;
  };
}

type Result = Promise<{
  balance: number;
  points_gained: number;
}>;

export default async function AddPoints(
  props: {
    amount: number;
    SBU: 'Hotel' | 'Restaurant' | 'Cinema';
    purchase_ref: string;
  },
  configs?: {canceler?: Canceler},
): Result {
  const {amount, SBU, purchase_ref} = props;
  const token = await GetPointsToken(configs);
  try {
    // get points
    const response: Response = await Axios.post(
      'https://go-backend.genesisgroupng.com/api/v1/add-point',
      {
        amount: amount,
        payment_type: 'app',
        channel: 'app',
        SBU: SBU,
        purchase_ref: purchase_ref,
      },
      {
        cancelToken: configs
          ? new Axios.CancelToken(c => (configs.canceler = c))
          : undefined,
        headers: {token: token},
      },
    );
    // return a promise resolve with the movies
    return Promise.resolve({
      balance: Number(response.data.data.total_points),
      points_gained: Number(response.data.data.point),
    });
  } catch (e) {
    Logger(e);
    return Promise.reject(e);
  }
}
