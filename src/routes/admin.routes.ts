import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";
import { AdminController } from "../controller/adminController";
import { adminService } from "../container";

const router = Router();

// Istanza del controller con AdminService iniettato
// (dependency injection: il controller non crea da solo il service)
const controller = new AdminController(adminService);

// =========================
// CREATE PRODUCER
// Endpoint admin per creare un nuovo produttore
// =========================
router.post(
  "/producers",
  authenticateJWT,          // verifica JWT
  roleMiddleware("admin"),  // solo admin
  controller.createProducer
);

// =========================
// CREATE CONSUMER
// Endpoint admin per creare un nuovo consumer
// =========================
router.post(
  "/consumers",
  authenticateJWT,
  roleMiddleware("admin"),
  controller.createConsumer
);

// =========================
// VIEW PRODUCERS
// Lista di tutti i produttori
// =========================
router.get(
  "/producers",
  authenticateJWT,
  roleMiddleware("admin"),
  controller.getProducers
);

// =========================
// VIEW CONSUMERS
// Lista di tutti i consumer
// =========================
router.get(
  "/consumers",
  authenticateJWT,
  roleMiddleware("admin"),
  controller.getConsumers
);

export default router;
