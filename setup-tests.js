import MockAsyncStorage from 'mock-async-storage';

const mockImpl = new MockAsyncStorage();
// eslint-disable-next-line no-undef
jest.mock('@react-native-community/async-storage', () => mockImpl);
// eslint-disable-next-line no-undef
jest.mock('bugsnag-react-native', () => ({
  // eslint-disable-next-line no-undef
  Configuration: jest.fn(),
  // eslint-disable-next-line no-undef
  Client: jest.fn(() => ({leaveBreadcrumb: jest.fn()})),
}));

// eslint-disable-next-line no-undef
jest.mock('crypto-js', () => ({
  enc: {
    Utf8: {
      // eslint-disable-next-line no-undef
      parse: jest.fn(),
    },
  },
}));

// eslint-disable-next-line no-undef
jest.mock('crypto-js/aes', () => ({
  // eslint-disable-next-line no-undef
  encrypt: jest.fn(),
  // eslint-disable-next-line no-undef
  decrypt: jest.fn(),
}));

// eslint-disable-next-line no-undef
jest.mock('crypto-js/enc-utf8', () => 'UTF-8');
