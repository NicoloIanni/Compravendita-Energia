/**
 * Producer Slots Controller
 *
 * Gestisce la CREAZIONE e l'AGGIORNAMENTO degli slot orari
 * associati al produttore autenticato.
 *
 * NOTA DI PROGETTO:
 * - Qui facciamo solo validazioni tecniche (tipo, formato).
 * - Le regole di dominio vere (slot solo domani, concorrenza, ecc.)
 *   stanno nel Service Layer.
 */

import { Request, Response, NextFunction } from "express";
import type { Transaction } from "sequelize";
import { sequelize } from "../db";
import { producerSlotService } from "../container";

/**
 * PATCH /producers/me/slots
 *
 * Upsert batch degli slot:
 * - se lo slot NON esiste → viene creato
 * - se lo slot ESISTE → viene aggiornato
 *
 * Payload atteso:
 * {
 *   "date": "YYYY-MM-DD",
 *   "slots": [
 *     { "hour": 10, "capacityKwh": 5, "pricePerKwh": 1.2 },
 *     { "hour": 11, "capacityKwh": 3, "pricePerKwh": 1.0 }
 *   ]
 * }
 */
export const upsertSlots = async (req: Request, res: Response, next: NextFunction) => {
  const { date, slots } = req.body;

  // Validazione base payload
  if (!date || !Array.isArray(slots)) {
    return res.status(400).json({
      error: "Payload must include date and slots array",
    });
  }

  // Validazione di struttura per ogni slot
  for (const slot of slots) {
    if (
      typeof slot.hour !== "number" ||
      typeof slot.capacityKwh !== "number" ||
      typeof slot.pricePerKwh !== "number"
    ) {
      return res.status(400).json({
        error: "Each slot must include hour, capacityKwh and pricePerKwh",
      });
    }


    if (slot.capacityKwh <= 0 || slot.pricePerKwh <= 0) {
      return res.status(400).json({
        error: "Invalid capacityKwh or pricePerKwh",
      });
    }
  }

  let t: Transaction | null = null;

  try {
    // ProducerProfileId dal JWT
    const producerProfileId = req.user?.profileId;
    if (!producerProfileId) {
      return res.status(403).json({ error: "Producer profile missing" });
    }

    // Transaction per evitare problemi concorrenza / aggiornamenti parziali
    t = await sequelize.transaction();

    await producerSlotService.upsertSlots(producerProfileId, date, slots, {
      transaction: t,
    });

    await t.commit();
    return res.status(200).json({ success: true });
  } catch (err) {
    if (t) await t.rollback();
    next(err);
  }
};

/**
 * PATCH /producers/me/updateslot
 *
 * Aggiornamento batch "libero" degli slot.
 * Usato per aggiornamenti mirati senza reinviare tutta la struttura.
 *
 * Payload:
 * {
 *   "updates": [
 *     { "date": "2026-01-21", "hour": 10, "capacityKwh": 4 },
 *     { "date": "2026-01-21", "hour": 11, "pricePerKwh": 0.9 }
 *   ]
 * }
 *
 */
export const updateSlot = async (req: Request, res: Response, next: NextFunction) => {
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
