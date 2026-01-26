import { Transaction, Op } from "sequelize";
import Reservation from "../models/Reservation";
import ProducerProfile from "../models/ProducerProfile";

/*
 * Repository Reservation
 * Incapsula tutta la logica di accesso ai dati delle prenotazioni
 */
export class ReservationRepository {


  // Crea una nuova prenotazione
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


  // Recupera una prenotazione per id
  async findById(id: number, tx?: Transaction): Promise<Reservation | null> {
    return Reservation.findByPk(id, {
      transaction: tx,
    });
  }

  // =========================
  // FIND BY ID FOR UPDATE (LOCK)
  // =========================

  // Recupera una prenotazione con lock pessimista
  async findByIdForUpdate(
    id: number,
    tx: Transaction
  ): Promise<Reservation | null> {
    return Reservation.findByPk(id, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });
  }


  // Salva una prenotazione già caricata
  async save(
    reservation: Reservation,
    tx?: Transaction
  ): Promise<Reservation> {
    return reservation.save({ transaction: tx });
  }


  // Somma le richieste PENDING per uno slot
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

  // =========================
  // FIND PENDING FOR RESOLVE
  // =========================

  // Recupera tutte le prenotazioni PENDING di uno slot con lock
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

  // =========================
  // Consumer purchases / carbon
  // =========================

  // Recupera le prenotazioni allocate (o pending) di un consumer
  // Supporta filtri per produttore, tipo energia e intervallo date
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


  // Recupera le prenotazioni ALLOCATED di un produttore
  async findAllocatedByProducer(filters: {
    producerProfileId: number;
    from?: Date;
    to?: Date;
  }): Promise<Reservation[]> {

    const fromDate = filters.from
      ? filters.from.toISOString().slice(0, 10)
      : undefined;

    const toDate = filters.to
      ? filters.to.toISOString().slice(0, 10)
      : undefined;

    return Reservation.findAll({
      where: {
        status: "ALLOCATED",
        producerProfileId: filters.producerProfileId,
        ...(fromDate || toDate
          ? {
            date: {
              ...(fromDate && { [Op.gte]: fromDate }),
              ...(toDate && { [Op.lte]: toDate }),
            },
          }
          : {}),
      },
      include: [
        {
          model: ProducerProfile,
          required: false,
        },
      ],
    });
  }


  // Verifica se esiste già una prenotazione PENDING
  // per lo stesso consumer e lo stesso slot
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


  // Metodo generico di findOne (usato per controlli di conflitto)
  async findOne(options: any, tx?: Transaction): Promise<Reservation | null> {
    return Reservation.findOne({
      ...options,
      transaction: tx,
    });
  }


  // Wrapper di Reservation.sum
  async sum(
    field: string | number | symbol,
    options: any
  ): Promise<number | null> {
    return Reservation.sum(field as any, options);
  }


  // Somma l'energia allocata per uno slot
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
