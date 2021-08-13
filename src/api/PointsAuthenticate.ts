import Axios, {Canceler} from 'axios';
import Logger from 'utils/Logger';

interface Response {
  data: {
    message: string;
    data: {
      mobileNumber: string;
    };
    token: string;
    statusCode: number;
    success: boolean;
  };
}

type Result = Promise<{
  token: string;
  phone: string;
}>;

type ReqData = {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
};

export default async function PointsAuthenticate(
  user: ReqData,
  configs?: {canceler?: Canceler},
): Result {
  try {
    // get points
    const response: Response = await Axios.post(
      'https://go-backend.genesisgroupng.com/api/v1/auth',
      {
        fname: user.firstName,
        lname: user.lastName,
        email: user.email,
        mobile: user.phoneNumber,
      },
      {
        cancelToken: configs
          ? new Axios.CancelToken(c => (configs.canceler = c))
          : undefined,
      },
    );
    // parse cinemas list to a more resonable object
    const result = {
      token: response.data.token,
      phone: response.data.data.mobileNumber,
    };
    // return a promise resolve with the movies
    return Promise.resolve(result);
  } catch (e) {
    Logger(e);
    return Promise.reject(e);
  }
}
