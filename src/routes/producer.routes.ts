import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";
import { resolveProducerRequests } from "../controller/producerResolveController";
import { upsertSlots } from "../controller/producerSlotsController";
import { getProducerRequestsOverview } from "../services/ProducerRequestService";
import {
  getMyEarnings,
  getMyStats,
  getMyStatsChart,
} from "../controller/producerStatsController";

const router = Router();

/**
 * Producer Slots
 */
router.patch(
  "/me/slots",
  authenticateJWT,
  roleMiddleware("producer"),
  upsertSlots
);


router.get(
  "/me/requests",
  authenticateJWT,
  roleMiddleware("producer"),
  async (req, res, next) => {
    try {
      const producerProfileId = req.user?.profileId;

      if (!producerProfileId) {
        return res
          .status(403)
          .json({ error: "Producer profile missing" });
      }

      const { date, fromHour, toHour } = req.query;

      if (!date || typeof date !== "string") {
        return res
          .status(400)
          .json({ error: "date è obbligatoria (YYYY-MM-DD)" });
      }

      const data = await getProducerRequestsOverview({
        producerProfileId, // ✅ UNICO ID CORRETTO
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

router.post(
  "/me/requests/resolve",
  authenticateJWT,
  roleMiddleware("producer"),
  resolveProducerRequests
);

/**
 * Producer Earnings (DAY 8)
 */
router.get(
  "/me/earnings",
  authenticateJWT,
  roleMiddleware("producer"),
  getMyEarnings
);

/**
 * Producer Stats (DAY 8)
 */
router.get(
  "/me/stats",
  authenticateJWT,
  roleMiddleware("producer"),
  getMyStats
);

router.get(
  "/me/stats/chart",
  authenticateJWT,
  roleMiddleware("producer"),
  getMyStatsChart 
);


export default router;