module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/assets/(.*)$': '<rootDir>/assets/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/ios/',
    '/android/',
    '/.maestro/',
  ],
  collectCoverageFrom: [
    'src/core/**/*.{ts,tsx}',
    'src/features/**/*.{ts,tsx}',
    'src/shared/ui/**/*.{ts,tsx}',
    'src/shared/adapters/key-value-store.memory.ts',
    'src/shared/api/errors.ts',
    '!**/*.d.ts',
    '!**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 20,
      lines: 20,
      statements: 20,
    },
  },
};
