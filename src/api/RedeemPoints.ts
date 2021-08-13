import Axios, {Canceler} from 'axios';
import Logger from 'utils/Logger';
import GetPointsToken from 'utils/GetPointsToken';

interface Response {
  data: {
    message: string;
    data: {
      reference: string;
    };
    statusCode: 201;
    success: true;
  };
}

type Result = Promise<string>;

export default async function RedeemPoints(
  props: {
    amount: number;
    SBU: 'Hotel' | 'Restaurant' | 'Cinema';
  },
  configs?: {canceler?: Canceler},
): Result {
  const {amount, SBU} = props;
  try {
    // get token
    const token = await GetPointsToken(configs);
    // get points
    const response: Response = await Axios.post(
      'https://go-backend.genesisgroupng.com/api/v1/redeem',
      {
        amount,
        SBU,
        channel: 'app',
      },
      {
        cancelToken: configs
          ? new Axios.CancelToken(c => (configs.canceler = c))
          : undefined,
        headers: {token: token},
      },
    );
    // return a promise resolve with the movies
    return Promise.resolve(response.data.data.reference);
  } catch (e) {
    Logger(e);
    return Promise.reject(e);
  }
}
