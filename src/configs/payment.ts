export const CONTRACT_CODES = {
  default: '994595483963',
  cinema: '841651629257',
  hotel: '334187446181',
  restaurant: '946269783272',
};

export const PAYMENT_API_KEY = 'MK_PROD_B87CG3757K';
// export const PAYMENT_API_KEY = 'MK_TEST_NFXPL23AVC';

export const PAYMENT_SECRET = 'S63N8CBY4V65J45HMPYFA5YLLHUW43DW';
// export const PAYMENT_SECRET = 'D4SLDSFXRQFHM67AAWCQ9WKB7C3M9JUE';

export const redirectUrl = 'http://genesisrestaurantng.com';

export const PAYMENT_GATEWAY_URL = __DEV__
  // ? 'https://sandbox.monnify.com/api/v1/merchant/transactions'
  // : 'https://sandbox.monnify.com/api/v1/merchant/transactions';
  ? 'https://api.monnify.com/api/v1/merchant/transactions'
  : 'https://api.monnify.com/api/v1/merchant/transactions';
