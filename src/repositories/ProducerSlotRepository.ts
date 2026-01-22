// src/repositories/ProducerSlotRepository.ts

import type { Transaction } from "sequelize";
import { Op } from "sequelize";
import ProducerSlot from "../models/ProducerSlot";

export class ProducerSlotRepository {
  private model: typeof ProducerSlot;

  constructor({ producerSlotModel }: { producerSlotModel: typeof ProducerSlot }) {
    this.model = producerSlotModel;
  }

  async createSlot(data: any, options: any = {}) {
    return ProducerSlot.create(data, options);
  }

async upsertBatch(
  slots: Partial<ProducerSlot>[],
  transaction: Transaction
): Promise<void> {
  await this.model.bulkCreate(slots as any, {
    transaction,
    updateOnDuplicate: ["capacityKwh", "pricePerKwh", "updatedAt"],
  });
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

  // =====================================================
  // DAY 6 – view richieste / stats (READ ONLY)
  // =====================================================
  async findByProducerAndDate(
    producerProfileId: number,
    date: string,
    fromHour: number,
    toHour: number
  ): Promise<ProducerSlot[]> {
    return this.model.findAll({
      where: {
        producerProfileId,
        date,
        hour: {
          [Op.between]: [fromHour, toHour],
        },
      },
      order: [["hour", "ASC"]],
    });
  }

  // =====================================================
  // DAY 7 – resolve richieste (WRITE + LOCK)
  // =====================================================
  async findForResolveByProducerAndDate(
    producerProfileId: number,
    date: string,
    transaction: Transaction
  ): Promise<ProducerSlot[]> {
    return this.model.findAll({
      where: {
        producerProfileId,
        date,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
      order: [["hour", "ASC"]],
    });
  }
  async findByProducerAndRange(input: {
    producerProfileId: number;
    from?: Date;
    to?: Date;
  }): Promise<ProducerSlot[]> {
    return this.model.findAll({
      where: {
        producerProfileId: input.producerProfileId,
        ...(input.from || input.to
          ? {
            date: {
              ...(input.from && { [Op.gte]: input.from }),
              ...(input.to && { [Op.lte]: input.to }),
            },
          }
          : {}),
      },
      order: [
        ["date", "ASC"],
        ["hour", "ASC"],
      ],
    });
  }
}

