// src/routes/consumer.routes.ts

import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";
import { ConsumerReservationController } from "../controller/consumerReservations.controller";
import  {reservationService } from "../container";
import {
  getConsumerPurchases,
  getConsumerCarbon,
} from "../controller/consumerQuery.controller";


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
// =========================
// Day 8 – PURCHASES
// =========================
router.get(
  "/me/purchases",
  authenticateJWT,
  roleMiddleware("consumer"),
  getConsumerPurchases
);

// =========================
// Day 8 – CARBON FOOTPRINT
// =========================
router.get(
  "/me/carbon",
  authenticateJWT,
  roleMiddleware("consumer"),
  getConsumerCarbon
);


export default router;
