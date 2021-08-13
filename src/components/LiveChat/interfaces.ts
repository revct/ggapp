interface WebViewState {
  url: null | string,
  status: string,
  backButtonEnabled: boolean,
  forwardButtonEnabled: boolean,
  loading: boolean,
  messageFromWebView: null | string,
  description?: string
};

export interface LiveChatProps {
  show: boolean,
  liveChat: {
    show: () => void,
    dismiss: () => void,
  }
};

export interface LiveChatState {
  errorMessge: null | string,
  isReady: boolean,
  isFetching: boolean,
  webview: WebViewState,
  checkoutUrl: null | string,
  initializationError: null | string,
  showModal: boolean,
  initialUrl: null | string,
};
