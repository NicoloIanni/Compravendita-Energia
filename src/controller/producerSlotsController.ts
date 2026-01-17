import { Request, Response, NextFunction } from "express";
import type { Transaction } from "sequelize";
import { sequelize } from "../config/db";
import { producerSlotService } from "../services/producerSlotServiceInstance";

export const patchCapacity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const body: any[] = req.body;
  if (!Array.isArray(body)) {
  return res.status(400).json({
    error: "Request body must be an array of slots"
  });
}
  const profileId = req.user?.profileId;
  const role = req.user?.role;

  // 401 se non autenticato
  if (!profileId) {
    return res.status(401).json({ error: "Producer non autenticato" });
  }

  // 403 se non producer
  if (role !== "producer") {
    return res.status(403).json({ error: "Accesso non consentito" });
  }

  let t: Transaction | null = null;
  try {
    t = await sequelize.transaction();

    await producerSlotService.batchUpdateCapacity(profileId, body, {
      transaction: t,
    });

    await t.commit();
    return res.status(200).json({ success: true });
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};

export const patchPrice = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const body: any[] = req.body;
  if (!Array.isArray(body)) {
  return res.status(400).json({
    error: "Request body must be an array of slots"
  });
}
  const profileId = req.user?.profileId;
  const role = req.user?.role;

  // 401 se non autenticato
  if (!profileId) {
    return res.status(401).json({ error: "Producer non autenticato" });
  }

  // controllo ruolo producer anche qui
  if (role !== "producer") {
    return res.status(403).json({ error: "Accesso non consentito" });
  }

  let t: Transaction | null = null;
  try {
    t = await sequelize.transaction();

    await producerSlotService.batchUpdatePrice(profileId, body, {
      transaction: t,
    });

    await t.commit();
    return res.status(200).json({ success: true });
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};
