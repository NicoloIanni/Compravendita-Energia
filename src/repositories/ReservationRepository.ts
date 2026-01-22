import { Transaction, Op } from "sequelize";
import Reservation from "../models/Reservation";
import ProducerProfile from "../models/ProducerProfile";

/* NOTE: puoi aggiungere tipi più stretti a option se vuoi, ad es. FindOptions, AggregateOptions,
   ma per semplicità li lasciamo `any` per supportare facilmente il mocking nei test. */

export class ReservationRepository {
  /* =========================
   * CREATE
   * ========================= */
  async create(
    data: {
      consumerId: number;
      producerProfileId: number;
      date: string;
      hour: number;
      requestedKwh: number;
      allocatedKwh: number;
      status: "PENDING" | "ALLOCATED" | "CANCELLED";
      totalCostCharged: number;
    },
    tx?: Transaction
  ): Promise<Reservation> {
    return Reservation.create(data, { transaction: tx });
  }

  /* =========================
   * FIND BY ID
   * ========================= */
  async findById(id: number, tx?: Transaction): Promise<Reservation | null> {
    return Reservation.findByPk(id, {
      transaction: tx,
    });
  }

  /* =========================
   * FIND BY ID FOR UPDATE (LOCK)
   * ========================= */
  async findByIdForUpdate(
    id: number,
    tx: Transaction
  ): Promise<Reservation | null> {
    return Reservation.findByPk(id, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });
  }

  /* =========================
   * SAVE (UNICO METODO)
   * ========================= */
  async save(
    reservation: Reservation,
    tx?: Transaction
  ): Promise<Reservation> {
    return reservation.save({ transaction: tx });
  }

  /* =========================
   * SUM REQUESTED (DAY 6)
   * ========================= */
  async sumRequestedForSlot(
    producerProfileId: number,
    date: string,
    hour: number
  ): Promise<number> {
    const result = await this.sum("requestedKwh", {
      where: {
        producerProfileId,
        date,
        hour,
        status: "PENDING",
      },
    });

    return Number(result || 0);
  }

  /* =========================
   * FIND PENDING FOR RESOLVE (DAY 7)
   * ========================= */
  async findPendingForResolveBySlot(
    producerProfileId: number,
    date: string,
    hour: number,
    tx: Transaction
  ): Promise<Reservation[]> {
    return Reservation.findAll({
      where: {
        producerProfileId,
        date,
        hour,
        status: "PENDING",
      },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
      order: [["id", "ASC"]],
    });
  }

  /* =========================
   * Consumer purchases / carbon (DAY 8)
   * ========================= */
  async findAllocatedByConsumer(filters: {
    consumerId: number;
    producerProfileId?: number;
    energyType?: string;
    from?: Date;
    to?: Date;
  }): Promise<Reservation[]> {
    return Reservation.findAll({
      where: {
        consumerId: filters.consumerId,
        status: {
          [Op.in]: ["ALLOCATED", "PENDING"],
        },
        ...(filters.from || filters.to
          ? {
              date: {
                ...(filters.from && { [Op.gte]: filters.from }),
                ...(filters.to && { [Op.lte]: filters.to }),
              },
            }
          : {}),
      },
      include: [
        {
          model: ProducerProfile,
          attributes: ["id", "energyType", "co2_g_per_kwh"],
          where: {
            ...(filters.energyType && { energyType: filters.energyType }),
            ...(filters.producerProfileId && {
              id: filters.producerProfileId,
            }),
          },
          required: true,
        },
      ],
      order: [
        ["date", "ASC"],
        ["hour", "ASC"],
      ],
    });
  }

  /* =========================
   * Producer earnings / stats (DAY 8)
   * ========================= */
  async findAllocatedByProducer(filters: {
    producerProfileId: number;
    from?: Date;
    to?: Date;
  }): Promise<Reservation[]> {
    return Reservation.findAll({
      where: {
        status: "ALLOCATED",
        ...(filters.from || filters.to
          ? {
              date: {
                ...(filters.from && { [Op.gte]: filters.from }),
                ...(filters.to && { [Op.lte]: filters.to }),
              },
            }
          : {}),
      },
      include: [
        {
          model: ProducerProfile,
          where: {
            id: filters.producerProfileId,
          },
          required: true,
        },
      ],
    });
  }

  /* =========================
   * Find pending by consumer + slot (exists pending)
   * ========================= */
  async findPendingByConsumerSlot(
    consumerId: number,
    producerProfileId: number,
    date: string,
    hour: number,
    tx?: Transaction
  ): Promise<Reservation | null> {
    return Reservation.findOne({
      where: {
        consumerId,
        producerProfileId,
        date,
        hour,
        status: "PENDING",
      },
      transaction: tx,
    });
  }

  /* =========================
   * Generic findOne
   *   (serve per conflitto same hour)
   * ========================= */
  async findOne(options: any, tx?: Transaction): Promise<Reservation | null> {
    return Reservation.findOne({
      ...options,
      transaction: tx,
    });
  }

  /* =========================
   * Generic sum helper
   * ========================= */
  async sum(
    field: string | number | symbol,
    options: any
  ): Promise<number | null> {
    return Reservation.sum(field as any, options);
  }

  /* =========================
   * Somma allocated per slot
   *  (usato in createReservation)
   * ========================= */
  async sumAllocatedForSlot(
    producerProfileId: number,
    date: string,
    hour: number
  ): Promise<number> {
    const result = await this.sum("allocatedKwh", {
      where: {
        producerProfileId,
        date,
        hour,
        status: "ALLOCATED",
      },
    });
    return Number(result || 0);
  }
}
