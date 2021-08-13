import {PaymentType} from 'api/InitializePayment';

export interface MonnifyPaymentVerifyProps {
  paymentReference: string;
  onComplete: (status: 'PAID' | 'PENDING' | 'FAILED') => void;
  onClose: () => void;
  isLoading?: boolean;
  bookingRef?: string;
  pointsGained?: number;
  paymentType?: PaymentType;
}

export interface MonnifyPaymentVerifyState {
  isFetching: boolean;
  errorMessage: null | string;
  isCompleted: boolean;
  show: boolean;
}
