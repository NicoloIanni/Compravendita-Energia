"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./models");
require("./db");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const health_routes_1 = require("./routes/health.routes");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const protected_routes_1 = __importDefault(require("./routes/protected.routes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const app = (0, express_1.default)();
exports.default = app;
app.use(express_1.default.json());
app.use(health_routes_1.healthRouter);
app.use('/auth', auth_routes_1.default);
app.use('/protected', protected_routes_1.default);
// SEMPRE ultimo
app.use(errorHandler_1.errorHandler);
