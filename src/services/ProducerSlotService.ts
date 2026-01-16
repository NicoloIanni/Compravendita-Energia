// src/services/ProducerSlotService.ts

import type { Transaction } from "sequelize";

interface SlotCapacityInput {
  date: string;
  hour: number;
  capacityKwh: number;
  pricePerKwh?: number;
}

interface SlotPriceInput {
  date: string;
  hour: number;
  pricePerKwh: number;
  capacityKwh?: number;
}

export class ProducerSlotService {
  private repo: any;
  constructor({ producerSlotRepository }: { producerSlotRepository: any }) {
    this.repo = producerSlotRepository;
  }

  validateCommon(item: { date?: string; hour?: number }) {
    const errors: string[] = [];

    if (!item.date) errors.push("date mancante");
    if (item.hour == null || item.hour < 0 || item.hour > 23)
      errors.push("hour deve essere tra 0 e 23");

    return errors;
  }

  validateCapacityItem(item: SlotCapacityInput) {
    const errors = this.validateCommon(item);
    if (item.capacityKwh == null || item.capacityKwh < 0) {
      errors.push("capacityKwh deve essere >= 0");
    }
    if (errors.length) {
      const err = new Error(errors.join("; "));
      (err as any).status = 400;
      throw err;
    }
  }

  validatePriceItem(item: SlotPriceInput) {
    const errors = this.validateCommon(item);
    if (item.pricePerKwh == null || item.pricePerKwh < 0) {
      errors.push("pricePerKwh deve essere >= 0");
    }
    if (errors.length) {
      const err = new Error(errors.join("; "));
      (err as any).status = 400;
      throw err;
    }
  }

  makeUpsertCapacity(profileId: number, items: SlotCapacityInput[]) {
    return items.map(item => ({
      producerProfileId: profileId,
      date: item.date,
      hour: item.hour,
      capacityKwh: item.capacityKwh,
      pricePerKwh: item.pricePerKwh ?? 0,
    }));
  }

  makeUpsertPrice(profileId: number, items: SlotPriceInput[]) {
    return items.map(item => ({
      producerProfileId: profileId,
      date: item.date,
      hour: item.hour,
      pricePerKwh: item.pricePerKwh,
      capacityKwh: item.capacityKwh ?? 0,
    }));
  }

  async batchUpdateCapacity(
    profileId: number,
    slots: SlotCapacityInput[],
    options: { transaction: Transaction }
  ) {
    slots.forEach(this.validateCapacityItem.bind(this));
    const toUpsert = this.makeUpsertCapacity(profileId, slots);
    return this.repo.upsertBatch(toUpsert, options.transaction);
  }

  async batchUpdatePrice(
    profileId: number,
    slots: SlotPriceInput[],
    options: { transaction: Transaction }
  ) {
    slots.forEach(this.validatePriceItem.bind(this));
    const toUpsert = this.makeUpsertPrice(profileId, slots);
    return this.repo.upsertBatch(toUpsert, options.transaction);
  }
}
