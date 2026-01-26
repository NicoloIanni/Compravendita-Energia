import type { Transaction } from "sequelize";
import { Op } from "sequelize";
import ProducerSlot from "../models/ProducerSlot";

// Normalizza una Date in stringa YYYY-MM-DD
// Serve per confronti coerenti lato DB
function normalize(d?: Date): string | undefined {
  return d ? d.toISOString().slice(0, 10) : undefined;
}

// Repository per l'accesso ai dati di ProducerSlot
export class ProducerSlotRepository {
  private model: typeof ProducerSlot;

  // Il modello viene iniettato (pattern utile per test/mocking)
  constructor({ producerSlotModel }: { producerSlotModel: typeof ProducerSlot }) {
    this.model = producerSlotModel;
  }

  // Crea un singolo slot
  async createSlot(data: any, options: any = {}) {
    return ProducerSlot.create(data, options);
  }

  // Upsert batch di slot:
  // - crea se non esistono
  // - aggiorna capacity/price se esistono già
  async upsertBatch(
    slots: Partial<ProducerSlot>[],
    transaction: Transaction
  ): Promise<void> {
    await this.model.bulkCreate(slots as any, {
      transaction,
      updateOnDuplicate: ["capacityKwh", "pricePerKwh", "updatedAt"],
    });
  }

  // Recupera uno slot specifico per produttore/data/ora
  // Esclude gli slot soft-deleted
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
        deleted: false, // esclude soft deleted
      },
      transaction,
    });
  }

  // =====================================================
  // View richieste / stats (READ ONLY)
  // =====================================================

  // Recupera tutti gli slot di un produttore per una data ed un intervallo orario
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
        deleted: false, // esclude soft deleted
        hour: {
          [Op.between]: [fromHour, toHour],
        },
      },
      order: [["hour", "ASC"]],
    });
  }

  // =====================================================
  //Resolve richieste (WRITE + LOCK)
  // =====================================================

  // Recupera gli slot da risolvere con lock pessimista
  // Qui non viene filtrato deleted: il resolve deve processare tutto
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

  // Recupera slot di un produttore in un intervallo di date
  async findByProducerAndRange(input: {
    producerProfileId: number;
    from?: Date;
    to?: Date;
  }): Promise<ProducerSlot[]> {
    const from = normalize(input.from);
    const to = normalize(input.to);

    return this.model.findAll({
      where: {
        producerProfileId: input.producerProfileId,
        deleted: false,
        ...(from || to
          ? {
            date: {
              ...(from && { [Op.gte]: from }),
              ...(to && { [Op.lte]: to }),
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

  // =============================
  // Soft-delete per slot
  // =============================

  // Soft delete di uno slot specifico
  async softDelete(
    where: {
      producerProfileId: number;
      date: string;
      hour: number;
    },
    transaction?: Transaction
  ): Promise<[number, ProducerSlot[]]> {
    return this.model.update(
      {
        deleted: true,
        deletedAt: new Date(),
      },
      {
        where,
        transaction,
        returning: true,
      }
    );
  }

  // Recupera slot per statistiche (NON filtra deleted)
  async findByProducerAndRangeForStats(input: {
    producerProfileId: number;
    from?: Date;
    to?: Date;
  }): Promise<ProducerSlot[]> {
    const from = normalize(input.from);
    const to = normalize(input.to);

    return this.model.findAll({
      where: {
        producerProfileId: input.producerProfileId,
        ...(from || to
          ? {
            date: {
              ...(from && { [Op.gte]: from }),
              ...(to && { [Op.lte]: to }),
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
