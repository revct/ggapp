import {ApiClassInterface} from './Api';
import Axios, {Canceler} from 'axios';
import {
  PAYMENT_GATEWAY_URL,
  CONTRACT_CODES,
  PAYMENT_API_KEY,
  PAYMENT_SECRET,
} from 'configs/payment';
import {redirectUrl} from '../configs/payment';
import Logger from '../utils/Logger';
import {base64Encode} from '../utils/Encryption';

export type PaymentMethod = 'CARD' | 'ACCOUNT_TRANSFER';

export type PaymentType = 'restaurant' | 'hotel' | 'cinema';

export interface SplitConfig {
  subAccountCode: string;
  feePercentage: number;
  splitPercentage: number;
  feeBearer: boolean;
}

/**
 * Single Cinema Interface
 */
export type ResponseBody = {
  transactionReference: string;
  paymentReference: string;
  merchantName: string;
  apiKey: string;
  redirectUrl: string;
  enabledPaymentMethod: Array<PaymentMethod>;
  checkoutUrl: string;
};

interface Response {
  data: {
    requestSuccessful: boolean;
    responseMessage: string;
    responseCode: string;
    responseBody: ResponseBody;
  };
}

interface RequestData {
  amount: number;
  customerName: string;
  customerEmail: string;
  paymentReference: string;
  paymentDescription?: string;
  redirectUrl?: string;
  currencyCode?: 'NGN';
  paymentMethods?: Array<PaymentMethod>;
  incomeSplitConfig?: Array<SplitConfig>;
  paymentType?: PaymentType;
}

type Result = Promise<ResponseBody>;

class InitializePayment implements ApiClassInterface {
  canceler?: Canceler;

  cancel = () => {
    if (!this.canceler) {
      return;
    }
    this.canceler();
  };

  fetch = async (data: RequestData): Result => {
    const {paymentType, ...requestData} = data;
    const authorization = base64Encode(`${PAYMENT_API_KEY}:${PAYMENT_SECRET}`);
    const reqData: RequestData & {contractCode: string} = {
      ...requestData,
      redirectUrl: data.redirectUrl || redirectUrl,
      contractCode: CONTRACT_CODES[paymentType || 'default'],
      currencyCode: 'NGN',
    };
    try {
      // get cinemas
      const response: Response = await Axios.post(
        PAYMENT_GATEWAY_URL + '/init-transaction',
        reqData,
        {
          cancelToken: new Axios.CancelToken(c => (this.canceler = c)),
          headers: {
            Authorization: `Basic ${authorization}`,
          },
        },
      );
      // return a promise resolve with the movies
      return Promise.resolve(response.data.responseBody);
    } catch (e) {
      Logger(e);
      return Promise.reject(e);
    }
  };
}

export default InitializePayment;
