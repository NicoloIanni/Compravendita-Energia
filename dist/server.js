"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const db_1 = require("./config/db");
async function bootstrap() {
    await db_1.sequelize.authenticate(); // fail fast se DB non raggiungibile
    console.log('DB connected');
    app_1.app.listen(env_1.env.port, '0.0.0.0', () => {
        console.log(`API listening on 0.0.0.0:${env_1.env.port}`);
    });
}
bootstrap().catch((e) => {
    console.error('Startup failed:', e);
    process.exit(1);
});
