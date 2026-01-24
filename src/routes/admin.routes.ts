

import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";
import { AdminController } from "../controller/adminController";
import { adminService } from "../container";

const router = Router();

// controller con AdminService iniettato
const controller = new AdminController(adminService);

// =========================
// Day 9 – CREATE PRODUCER
// =========================
router.post(
  "/producers",
  authenticateJWT,
  roleMiddleware("admin"),
  controller.createProducer
);

// =========================
// Day 9 – CREATE CONSUMER
// =========================
router.post(
  "/consumers",
  authenticateJWT,
  roleMiddleware("admin"),
  controller.createConsumer
);
// =========================
// Day 9 – VIEW PRODUCERS
// =========================
router.get(
  "/producers",
  authenticateJWT,
  roleMiddleware("admin"),
  controller.getProducers
);

// =========================
// Day 9 – VIEW CONSUMERS
// =========================
router.get(
  "/consumers",
  authenticateJWT,
  roleMiddleware("admin"),
  controller.getConsumers
);


export default router;
