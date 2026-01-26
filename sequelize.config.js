// Carica le variabili d'ambiente da .env
// Necessario per DB_HOST, DB_USER, ecc.
require("dotenv").config();

// Registra ts-node per permettere a sequelize-cli
// di eseguire migration/seed scritti in TypeScript
require("ts-node").register({
  project: "tsconfig.json",
});

module.exports = {
  // =========================
  // AMBIENTE DEVELOPMENT
  // =========================
  development: {
    dialect: "postgres",                 // DBMS usato
    host: process.env.DB_HOST,            // host DB
    port: process.env.DB_PORT,            // porta DB
    username: process.env.DB_USER,        // utente DB
    password: process.env.DB_PASS,        // password DB
    database: process.env.DB_NAME,        // nome database

    // Percorso migration in TypeScript
    migrations: ["src/migrations/*.ts"],

    // Percorso modelli Sequelize
    models: ["src/models/*.ts"],

    // Percorso seed
    seeders: ["src/seeders/*.ts"],

    // Timezone DB (UTC)
    timezone: "+00:00"
  },

  // =========================
  // AMBIENTE TEST
  // =========================
  test: {
    dialect: "postgres",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,

    // Migration TypeScript (usate da jest + sequelize-cli)
    migrations: ["src/migrations/*.ts"],

    // Modelli TypeScript
    models: ["src/models/*.ts"],

    // Seed TypeScript
    seeders: ["src/seeders/*.ts"],

    timezone: "+00:00"
  },

  // =========================
  // AMBIENTE PRODUCTION
  // =========================
  production: {
    dialect: "postgres",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,

    // In produzione si usano file compilati JS
    migrations: ["src/migrations/*.js"],
    models: ["dist/models/*.js"],
    seeders: ["src/seeders/*.js"],

    timezone: "+00:00"
  }
};
