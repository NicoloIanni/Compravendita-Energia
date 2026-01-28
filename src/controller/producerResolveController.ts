import { Request, Response, NextFunction } from "express";
import { settlementService } from "../container";

/**
 * POST /producers/me/requests/resolve?date=YYYY-MM-DD
 *
 * “Resolve” = applica l’allocazione:
 * - se sumRequested <= capacity => NoCut
 * - se sumRequested > capacity => ProportionalCut
 *
 * Il SettlementService deve gestire:
 * - update allocatedKwh
 * - eventuali rimborsi (difference) ai consumer
 * - transaction
 */
export const resolveProducerRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const producerProfileId = req.user?.profileId;
  const { date } = req.query;

  // auth/role check già fatto in middleware, qui controlliamo solo profileId
  if (!producerProfileId) {
    return res.status(403).json({ error: "Profilo produttore non associato all’utente" });
  }

  // date è obbligatoria per risolvere un giorno specifico
  if (!date || typeof date !== "string") {
    return res.status(400).json({ error: "La data è obbligatoria e deve essere nel formato YYYY-MM-DD" });
  }

  try {
    const result = await settlementService.resolveDay(producerProfileId, date);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
