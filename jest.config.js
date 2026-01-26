/** @type {import("jest").Config} */
module.exports = {
  // Usa ts-jest per eseguire test scritti in TypeScript
  preset: "ts-jest",

  // Ambiente di esecuzione: Node.js (no browser / DOM)
  testEnvironment: "node",

  // Pattern per individuare i file di test
  // Tutti i file *.test.ts sotto la cartella tests
  testMatch: ["**/tests/**/*.test.ts"],

  // Trasformazione dei file TypeScript prima dell'esecuzione
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        // Configurazione TypeScript dedicata ai test
        tsconfig: "tsconfig.test.json",
      },
    ],
  },

  // Script eseguito una sola volta prima di tutti i test
  // Qui tipicamente si droppa/ricrea il DB e si lanciano le migration
  globalSetup: "<rootDir>/tests/setup/jest.globalSetup.ts",

  // Script eseguito una sola volta dopo tutti i test
  // Qui si chiude la connessione al database
  globalTeardown: "<rootDir>/tests/setup/jest.globalTeardown.ts",

  // Pulisce automaticamente i mock tra un test e l'altro
  clearMocks: true,

  // Ripristina le implementazioni originali dei mock
  restoreMocks: true,
};
