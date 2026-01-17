"use strict";
// src/routes/consumer.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const role_1 = require("../middlewares/role");
const consumerReservations_controller_1 = require("../controller/consumerReservations.controller");
const container_1 = require("../container"); // o dove istanzi i service
const router = (0, express_1.Router)();
const controller = new consumerReservations_controller_1.ConsumerReservationController(container_1.reservationService);
router.post("/consumers/me/reservations", auth_1.authenticateJWT, (0, role_1.roleMiddleware)("consumer"), controller.createReservation);
exports.default = router;
