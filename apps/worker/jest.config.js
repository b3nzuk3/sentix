/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@sentix/prompts/(.*)$': '<rootDir>../packages/prompts/src/$1'
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
        skipLibCheck: true,
        sourceMap: true,
        types: ['jest', 'node']
      }
    }]
  }
};
