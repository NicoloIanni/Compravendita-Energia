/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  testMatch: ["**/tests/**/*.test.ts"],

  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },

  globalSetup: "<rootDir>/tests/setup/jest.globalSetup.ts",
  globalTeardown: "<rootDir>/tests/setup/jest.globalTeardown.ts",

  // opzionale ma utile
  clearMocks: true,
  restoreMocks: true,
};
