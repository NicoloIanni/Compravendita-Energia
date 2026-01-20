import { Transaction } from "sequelize";
import Reservation from "../models/Reservation";

interface CreateReservationData {
  consumerId: number;
  producerProfileId: number;
  date: string;
  hour: number;
  requestedKwh: number;
  allocatedKwh: number;
  status: "PENDING" | "ALLOCATED" | "CANCELLED";
  totalCostCharged: number;
}

export class ReservationRepository {
  /* =========================
   * CREATE
   * ========================= */
  async create(
    data: CreateReservationData,
    tx?: Transaction
  ): Promise<Reservation> {
    return Reservation.create(data, { transaction: tx });
  }

  /* =========================
   * FIND BY ID
   * ========================= */
  async findById(
    id: number,
    tx?: Transaction
  ): Promise<Reservation | null> {
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
    const result = await Reservation.sum("requestedKwh", {
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
   * DAY 7 – resolve: prenotazioni PENDING per slot
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
}
