const path = require('path');

module.exports = {
  devServer: {
    port: 3002,
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src/'),
    }
  },
  jest: {
    configure: {
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
    },
  },
};
