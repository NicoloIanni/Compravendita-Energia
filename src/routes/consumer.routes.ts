// src/routes/consumer.routes.ts

import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";
import { ConsumerReservationController } from "../controller/consumerReservations.controller";
import  {reservationService } from "../container"; // o dove istanzi i service

const router = Router();

const controller = new ConsumerReservationController(reservationService);

router.post(
  "/consumers/me/reservations",
  authenticateJWT,
  roleMiddleware("consumer"),
  controller.createReservation
);

export default router;
