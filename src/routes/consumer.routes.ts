// src/routes/consumer.routes.ts

import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";
import { ConsumerReservationController } from "../controller/consumerReservations.controller";
import  {reservationService } from "../container"; // o dove istanzi i service

const router = Router();

const controller = new ConsumerReservationController(reservationService);

router.post(
  "/me/reservations",
  authenticateJWT,
  roleMiddleware("consumer"),
  controller.createReservation
);
// =========================
// Day 5 – UPDATE / CANCEL
// =========================
router.patch(
  "/me/reservations/:id",
  authenticateJWT,
  roleMiddleware("consumer"),
  controller.updateReservation
);

export default router;
