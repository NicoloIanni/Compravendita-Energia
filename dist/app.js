"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./routes/consumer.routes");
console.log("🔥 FORCED consumer.routes import");
require("./models");
require("./db");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const health_routes_1 = require("./routes/health.routes");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const protected_routes_1 = __importDefault(require("./routes/protected.routes"));
const errorHandler_1 = require("./middlewares/errorHandler");
const auth_1 = require("./middlewares/auth");
const producerSlotsController_1 = require("./controller/producerSlotsController");
const consumer_routes_1 = __importDefault(require("./routes/consumer.routes"));
const app = (0, express_1.default)();
// ➤ PRIMA registra il body parser
app.use(express_1.default.json());
// ➤ Route slots (PATCH)
app.patch("/producers/me/slots/capacity", auth_1.authenticateJWT, producerSlotsController_1.patchCapacity);
app.patch("/producers/me/slots/price", auth_1.authenticateJWT, producerSlotsController_1.patchPrice);
// ➤ altre route
app.use(consumer_routes_1.default);
app.use(health_routes_1.healthRouter);
app.use("/auth", auth_routes_1.default);
app.use("/protected", protected_routes_1.default);
// ➤ ERRORE handler (SEMPRRE ultimo)
app.use(errorHandler_1.errorHandler);
exports.default = app;
