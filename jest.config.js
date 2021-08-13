module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: true,
  coveragePathIgnorePatterns: ['/node_modules/', '/jest'],
  setupFilesAfterEnv: ['<rootDir>/setup-tests.js'],
};
