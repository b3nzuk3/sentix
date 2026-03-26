/**
 * Jest configuration for @sentix/api
 * Uses ts-jest to compile TypeScript directly (no pre-build needed for tests)
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: false,
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true
      }
    }]
  },
  // Run once before all test suites
  globalSetup: '<rootDir>/jest.global-setup.js',
  // Run once after all test suites
  globalTeardown: '<rootDir>/jest.global-teardown.js',
  // Setup file runs before each test file
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Ensure clean environment
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Test timeout
  testTimeout: 30000,
  // Collect coverage if needed
  collectCoverage: false
};
