import Axios, {Canceler} from 'axios';
import Logger from 'utils/Logger';
import GetPointsToken from 'utils/GetPointsToken';

type Result = Promise<{
  balance: number;
}>;

interface Response {
  data: {
    balance: string;
    message: string;
    statusCode: number;
    success: boolean;
  };
}

export default async function UpdateRedemption(
  props: {
    status: 'success' | 'failed';
    reference: string;
    purchase_reference: string;
  },
  configs?: {canceler?: Canceler},
): Result {
  const {status, reference, purchase_reference} = props;
  try {
    // get points token
    const token = await GetPointsToken(configs);
    // get points
    const response: Response = await Axios.put(
      'https://go-backend.genesisgroupng.com/api/v1/update-redeem',
      {status, reference, purchase_reference},
      {
        cancelToken: configs
          ? new Axios.CancelToken(c => (configs.canceler = c))
          : undefined,
        headers: {Token: token},
      },
    );
    // return a promise resolve with the movies
    return Promise.resolve({
      balance: Number(response.data.balance),
    });
  } catch (e) {
    Logger(e);
    return Promise.reject(e);
  }
}
