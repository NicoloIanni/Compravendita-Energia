import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";
import { resolveProducerRequests } from "../controller/producerResolveController";
import { updateSlot, upsertSlots } from "../controller/producerSlotsController";
import { getProducerRequestsOverview } from "../services/ProducerRequestService";
import {
  getMyEarnings,
  getMyStats,
  getMyStatsChart,
} from "../controller/producerStatsController";

const router = Router();

// =========================
// Update / upsert slot capacity & price
// =========================
router.patch(
  "/me/slots",
  authenticateJWT,
  roleMiddleware("producer"),
  upsertSlots
);

// =========================
// VIEW REQUESTS
// =========================
router.get(
  "/me/requests",
  authenticateJWT,
  roleMiddleware("producer"),
  async (req, res, next) => {
    try {
      const producerProfileId = req.user?.profileId;

      // Il producer deve avere profileId nel JWT
      if (!producerProfileId) {
        return res
          .status(403)
          .json({ error: "Producer profile missing" });
      }

      const { date, fromHour, toHour } = req.query;

      // Validazione data obbligatoria
      if (!date || typeof date !== "string") {
        return res
          .status(400)
          .json({ error: "date è obbligatoria (YYYY-MM-DD)" });
      }

      // Recupero overview richieste per slot
      const data = await getProducerRequestsOverview({
        producerProfileId,
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

// =========================
// RESOLVE REQUESTS
// =========================
router.post(
  "/me/requests/resolve",
  authenticateJWT,
  roleMiddleware("producer"),
  resolveProducerRequests
);

// =========================
// Producer Earnings
// =========================
router.get(
  "/me/earnings",
  authenticateJWT,
  roleMiddleware("producer"),
  getMyEarnings
);

// =========================
// Producer Stats 
// =========================
router.get(
  "/me/stats",
  authenticateJWT,
  roleMiddleware("producer"),
  getMyStats
);

// =========================
// Producer Stats Chart 
// =========================
router.get(
  "/me/stats/chart",
  authenticateJWT,
  roleMiddleware("producer"),
  getMyStatsChart 
);

// =========================
// Update singolo slot
// =========================
router.patch(
  "/me/updateslot",
  authenticateJWT,
  roleMiddleware("producer"),
  updateSlot
);

export default router;
