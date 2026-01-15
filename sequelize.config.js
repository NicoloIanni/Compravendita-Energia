require("dotenv").config(); 
require("ts-node").register({
  project: "tsconfig.json",
});

module.exports = {
  development: {
    dialect: "postgres",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    migrations: ["src/migrations/*.ts"],
    models: ["src/models/*.ts"],
    seeders: ["src/seeders/*.ts"],
    timezone: "+00:00"
  },
  test: {
    dialect: "postgres",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    migrations: ["src/migrations/*.ts"],
    models: ["src/models/*.ts"],
    seeders: ["src/seeders/*.ts"],
    timezone: "+00:00"
  },
  production: {
    dialect: "postgres",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    migrations: ["src/migrations/*.js"],
    models: ["dist/models/*.js"],
    seeders: ["src/seeders/*.js"],
    timezone: "+00:00"
  }
};
