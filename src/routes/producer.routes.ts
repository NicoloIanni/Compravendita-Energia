import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";
import {
  patchCapacity,
  patchPrice,
} from "../controller/producerSlotsController";
import { getProducerRequestsOverview } from "../services/ProducerRequestService";

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

router.get(
  "/me/requests",
  authenticateJWT,
  roleMiddleware("producer"),
  async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      const { date, fromHour, toHour } = req.query;

      if (!date || typeof date !== "string") {
        return res.status(400).json({ error: "date è obbligatoria (YYYY-MM-DD)" });
      }

      const data = await getProducerRequestsOverview({
        userId,
        date,
        fromHour: fromHour !== undefined ? Number(fromHour) : undefined,
        toHour: toHour !== undefined ? Number(toHour) : undefined,
      });

      return res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
