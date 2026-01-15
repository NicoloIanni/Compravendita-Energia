"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
require("dotenv/config");
const sequelize_typescript_1 = require("sequelize-typescript");
const models_1 = require("./models");
exports.sequelize = new sequelize_typescript_1.Sequelize({
    dialect: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    models: [models_1.User, models_1.ProducerProfile, models_1.ProducerSlot, models_1.Reservation],
    logging: false,
});
