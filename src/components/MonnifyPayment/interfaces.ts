import { NavigationStackScreenProps } from "react-navigation-stack";
import { NavigationParams } from "react-navigation";

export interface MonnifyPaymentInfo {
  amount: number,
  customerName: string,
  customerEmail: string,
  paymentReference: string,
  paymentDescription?: string,
  checkoutUrl?: string,
}

interface NavigationState {
  paymentReference: string,
  redirectValidation: (url:string) => boolean,
  onPaymentComplete: (paymentReference:string) => void,
  paymentInfo: MonnifyPaymentInfo,
};

interface WebViewState {
  url: null | string,
  status: string,
  backButtonEnabled: boolean,
  forwardButtonEnabled: boolean,
  loading: boolean,
  messageFromWebView: null | string,
  description?: string
};

export interface MonnifyPaymentProps extends NavigationStackScreenProps<NavigationParams, NavigationState>  {

};

export interface MonnifyPaymentState {
  isReady: boolean,
  isFetching: boolean,
  errorMessge: null | string,
  webview: WebViewState,
  checkoutUrl: null | string,
  initializationError: null | string,
};
