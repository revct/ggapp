import {ApiClassInterface} from './Api';
import Axios, {Canceler} from 'axios';
import {
  PAYMENT_GATEWAY_URL,
  PAYMENT_API_KEY,
  PAYMENT_SECRET,
} from '../configs/payment';
import Logger from '../utils/Logger';
import {PaymentType} from './InitializePayment';
import {base64Encode} from '../utils/Encryption';

type EnabledPaymentMethod = 'CARD' | 'ACCOUNT_TRANSFER';

/**
 * Single Cinema Interface
 */
export type PaymentVerifyResponseBody = {
  paymentMethod?: EnabledPaymentMethod;
  createdOn: string;
  amount: number;
  fee?: number;
  currencyCode: 'NGN';
  completedOn?: string;
  customerName: string;
  customerEmail: string;
  paymentDescription: string;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  transactionReference: string;
  paymentReference: string;
  payableAmount?: number;
  amountPaid?: number;
  completed?: boolean;
};

interface Response {
  data: {
    requestSuccessful: boolean;
    responseMessage: string;
    responseCode: string;
    responseBody: PaymentVerifyResponseBody;
  };
}

type Result = Promise<PaymentVerifyResponseBody>;

class VerifyPayment implements ApiClassInterface {
  canceler?: Canceler;

  cancel = () => {
    if (!this.canceler) {
      return;
    }
    this.canceler();
  };

  fetch = async (
    paymentReference: string,
    _paymentType?: PaymentType,
  ): Result => {
    try {
      const authorization = base64Encode(
        `${PAYMENT_API_KEY}:${PAYMENT_SECRET}`,
      );
      // get cinemas
      const response: Response = await Axios.get(
        PAYMENT_GATEWAY_URL + '/query?paymentReference=' + paymentReference,
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

export default VerifyPayment;
