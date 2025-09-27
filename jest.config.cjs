module.exports = {
  name: "mailerlite-api-v2-node",
  testEnvironment: "node",
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  setupFilesAfterEnv: ["jest-extended/all"],
  transformIgnorePatterns: [
    "node_modules/(?!(camelcase-keys|snakecase-keys|map-obj|quick-lru)/)",
  ],
  moduleNameMapping: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
  testMatch: ["**/__tests__/**/*.(ts|js)", "**/?(*.)(spec|test).(ts|js)"],
};
