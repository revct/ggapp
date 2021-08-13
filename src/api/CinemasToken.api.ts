import RemoteConfigApi from './RemoteConfig.api';

type Response = {
  success: boolean;
  message?: string;
  data?: string;
};

export default async function CinemasTokenApi(): Promise<Response> {
  return new Promise(async res => {
    try {
      // get snapshot value
      const data = await RemoteConfigApi('cinemas_token');
      // resolve promise with data
      res({
        success: true,
        // data: __DEV__ ? data.token_DEV_ : data.token,
        data: String(data.token).trim(),
      });
    } catch (e) {
      // get error message
      let errorMessage = e.message;
      if (/network/i.test(errorMessage)) {
        errorMessage = 'Please check your internet connection and try again.';
      }
      // resolve promise with error
      res({success: false, message: errorMessage});
    }
  });
}

// fc5316503e038a74e11f85b0a5760d5230523548
