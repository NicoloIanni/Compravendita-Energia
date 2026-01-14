"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const env_1 = require("./env");
exports.sequelize = new sequelize_1.Sequelize(env_1.env.db.name, env_1.env.db.user, env_1.env.db.password, {
    host: env_1.env.db.host,
    port: env_1.env.db.port,
    dialect: 'postgres',
    logging: false
});
