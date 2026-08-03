module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: { '\\.(css)$': 'identity-obj-proxy' },
  testMatch: ['<rootDir>/src/**/*.test.{js,jsx}'],
}
