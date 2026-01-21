// src/routes/consumer.routes.ts

import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";
import { ConsumerReservationController } from "../controller/consumerReservations.controller";
import  {consumerQueryService, reservationService } from "../container";



const router = Router();

const controller = new ConsumerReservationController(
  reservationService,
  consumerQueryService
);

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
  controller.getMyPurchases
  
);

// =========================
// Day 8 – CARBON FOOTPRINT
// =========================
router.get(
  "/me/carbon",
  authenticateJWT,
  roleMiddleware("consumer"),
  controller.getMyCarbon
);


export default router;
