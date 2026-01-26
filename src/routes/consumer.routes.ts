import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";
import { ConsumerReservationController } from "../controller/consumerController";
import { consumerQueryService, reservationService } from "../container";
import { listProducersWithSlots } from "../controller/consumerController";

const router = Router();

// Controller consumer con service iniettati
const controller = new ConsumerReservationController(
  reservationService,
  consumerQueryService
);

// =========================
// CREATE RESERVATION
// =========================
router.post(
  "/me/reservations",
  authenticateJWT,
  roleMiddleware("consumer"),
  controller.createReservation
);

// =========================
// UPDATE / CANCEL RESERVATION
// =========================
router.patch(
  "/me/updatereservations/:id",
  authenticateJWT,
  roleMiddleware("consumer"),
  controller.updateReservation
);

// =========================
// PURCHASES
// Elenco acquisti del consumer
// =========================
router.get(
  "/me/purchases",
  authenticateJWT,
  roleMiddleware("consumer"),
  controller.getMyPurchases
);

// =========================
// CARBON FOOTPRINT
// Calcolo impronta carbonica del consumer
// =========================
router.get(
  "/me/carbon",
  authenticateJWT,
  roleMiddleware("consumer"),
  controller.getMyCarbon
);

// =========================
// Lista produttori con slot disponibili
// =========================
router.get(
  "/me/producers",
  authenticateJWT,
  roleMiddleware("consumer"),
  listProducersWithSlots
);

export default router;
