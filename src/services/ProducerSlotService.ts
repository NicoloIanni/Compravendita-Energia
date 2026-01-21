// src/services/ProducerSlotService.ts

import type { Transaction } from "sequelize";

interface SlotInput {
  hour: number;
  capacityKwh: number;
  pricePerKwh: number;
}

export class ProducerSlotService {
  private repo: any;

  constructor({ producerSlotRepository }: { producerSlotRepository: any }) {
    this.repo = producerSlotRepository;
  }

  // =========================
  // VALIDATION
  // =========================
  private validateSlot(slot: SlotInput) {
    const errors: string[] = [];

    if (slot.hour == null || slot.hour < 0 || slot.hour > 23) {
      errors.push("hour deve essere tra 0 e 23");
    }

    if (slot.capacityKwh == null || slot.capacityKwh <= 0) {
      errors.push("capacityKwh deve essere > 0");
    }

    if (slot.pricePerKwh == null || slot.pricePerKwh < 0) {
      errors.push("pricePerKwh deve essere >= 0");
    }

    if (errors.length) {
      const err = new Error(errors.join("; "));
      (err as any).status = 400;
      throw err;
    }
  }

  // =========================
  // UPSERT UNICO
  // =========================
  async upsertSlots(
    producerProfileId: number,
    date: string,
    slots: SlotInput[],
    options?: { transaction?: Transaction }
  ) {
    if (!date) {
      const err = new Error("date mancante");
      (err as any).status = 400;
      throw err;
    }

    if (!Array.isArray(slots) || slots.length === 0) {
      const err = new Error("slots deve essere un array non vuoto");
      (err as any).status = 400;
      throw err;
    }

    const toUpsert = slots.map((slot) => {
      this.validateSlot(slot);

      return {
        producerProfileId,
        date,
        hour: slot.hour,
        capacityKwh: slot.capacityKwh,
        pricePerKwh: slot.pricePerKwh,
      };
    });

    return this.repo.upsertBatch(
      toUpsert,
      options?.transaction
    );
  }
}
