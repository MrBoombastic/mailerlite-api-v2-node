module.exports = {
  testEnvironment: "node",
  preset: "ts-jest",
  testMatch: ["**/*.spec.ts", "**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  setupFilesAfterEnv: ["jest-extended/all"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Mock problematic ESM modules
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^camelcase-keys$": "<rootDir>/test/__mocks__/camelcase-keys.js",
    "^snakecase-keys$": "<rootDir>/test/__mocks__/snakecase-keys.js",
  },
};
