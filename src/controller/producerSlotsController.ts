import { Request, Response, NextFunction } from "express";
import type { Transaction } from "sequelize";
import { sequelize } from "../db";
import { producerSlotService } from "../services/producerSlotServiceInstance";


/**
 * PATCH /producers/me/slots
 *
 * Aggiorna o crea slot di produzione.
 * Ogni slot DEVE avere sia capacityKwh che pricePerKwh.
 */
export const upsertSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { date, slots } = req.body;

  if (!date || !Array.isArray(slots)) {
    return res.status(400).json({
      error: "Payload must include date and slots array",
    });
  }

  for (const slot of slots) {
    if (
      typeof slot.hour !== "number" ||
      typeof slot.capacityKwh !== "number" ||
      typeof slot.pricePerKwh !== "number"
    ) {
      return res.status(400).json({
        error:
          "Each slot must include hour, capacityKwh and pricePerKwh",
      });
    }

    if (slot.capacityKwh <= 0 || slot.pricePerKwh < 0) {
      return res.status(400).json({
        error: "Invalid capacityKwh or pricePerKwh",
      });
    }
  }

  let t: Transaction | null = null;

  try {
    const producerProfileId = req.user?.profileId;
    if (!producerProfileId) {
      return res
        .status(403)
        .json({ error: "Producer profile missing" });
    }

    t = await sequelize.transaction();

    await producerSlotService.upsertSlots(
      producerProfileId,
      date,
      slots,
      { transaction: t }
    );

    await t.commit();
    return res.status(200).json({ success: true });
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};

// producers.controller.ts

/**
 * PATCH /producers/me/updateslot
 *
 * Aggiorna batch di slot per capacity e/o price.
 */
export const updateSlot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const producerProfileId = req.user?.profileId;
  const { updates } = req.body;

  if (!producerProfileId) {
    return res.status(403).json({ error: "Producer non autorizzato" });
  }

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({
      error: "Array di aggiornamenti vuoto o mancante",
    });
  }

  let t: Transaction | null = null;

  try {
    t = await sequelize.transaction();

    console.log(">>> updateSlot called");
    console.log("PROFILE ID:", producerProfileId);
    console.log("BODY updates:", JSON.stringify(updates, null, 2));

    const updatedSlots = await producerSlotService.updateSlots(
      producerProfileId,
      updates,
      { transaction: t }
    );

    await t.commit();
    return res.status(200).json({
      message: "Aggiornamenti completati",
      updatedSlots,
    });
  } catch (err) {
    if (t) await t.rollback();
    return next(err);
  }
};


