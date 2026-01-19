// src/repositories/ProducerSlotRepository.ts

import type { Transaction } from "sequelize";
import ProducerSlot from "../models/ProducerSlot";

export class ProducerSlotRepository {
  private model: typeof ProducerSlot;

  constructor({ producerSlotModel }: { producerSlotModel: typeof ProducerSlot }) {
    this.model = producerSlotModel;
  }

  async upsertBatch(
    slots: Partial<ProducerSlot>[],
    transaction: Transaction
  ): Promise<void> {
    const ops = slots.map(slot =>
      this.model.upsert(slot as any, { transaction })
    );

    await Promise.all(ops);
  }
   async findByProducerDateHour(
    producerProfileId: number,
    date: string,
    hour: number,
    transaction?: Transaction
  ): Promise<ProducerSlot | null> {
    return this.model.findOne({
      where: {
        producerProfileId,
        date,
        hour,
      },
      transaction,
    });
  }
  async findByProducerAndDate(
    producerProfileId: number,
    date: string,
    fromHour: number,
    toHour: number
  ) {
    return ProducerSlot.findAll({
      where: {
        producerProfileId,
        date,
        hour: {
          $between: [fromHour, toHour],
        },
      },
      order: [["hour", "ASC"]],
    });
  }
}
