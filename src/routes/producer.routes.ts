import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";
import {
  patchCapacity,
  patchPrice,
} from "../controller/producerSlotsController";

const router = Router();

/**
 * Producer Slots
 */
router.patch(
  "/me/slots/capacity",
  authenticateJWT,
  roleMiddleware("producer"),
  patchCapacity
);

router.patch(
  "/me/slots/price",
  authenticateJWT,
  roleMiddleware("producer"),
  patchPrice
);

export default router;
