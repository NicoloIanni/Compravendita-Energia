"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const env_1 = require("./env");
// importa i tuoi model
const User_1 = __importDefault(require("../models/User"));
const ProducerProfile_1 = __importDefault(require("../models/ProducerProfile"));
const ProducerSlot_1 = __importDefault(require("../models/ProducerSlot"));
const Reservation_1 = __importDefault(require("../models/Reservation"));
exports.sequelize = new sequelize_typescript_1.Sequelize({
    database: env_1.env.db.name,
    username: env_1.env.db.user,
    password: env_1.env.db.password,
    host: env_1.env.db.host,
    port: env_1.env.db.port,
    dialect: "postgres",
    logging: false,
    models: [
        User_1.default,
        ProducerProfile_1.default,
        ProducerSlot_1.default,
        Reservation_1.default,
    ], // <-- qui registri TUTTI i model
});
