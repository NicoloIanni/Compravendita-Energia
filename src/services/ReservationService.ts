import { sequelize } from "../db";
import { addHours, isAfter, startOfHour } from "date-fns";

import type { Transaction } from "sequelize";
import Reservation from "../models/Reservation";

import { UserRepository } from "../repositories/UserRepository";
import { ProducerSlotRepository } from "../repositories/ProducerSlotRepository";
import { ReservationRepository } from "../repositories/ReservationRepository";
import { Op } from "sequelize";

/**
 * Errori di dominio (verranno mappati dal middleware)
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

/* =========================
 * CREATE (Day 4)
 * ========================= */
interface CreateReservationParams {
  consumerId: number;
  producerProfileId: number;
  date: string; // YYYY-MM-DD
  hour: number; // 0–23
  requestedKwh: number;
}

/* =========================
 * UPDATE / CANCEL (Day 5)
 * ========================= */
interface UpdateReservationParams {
  consumerId: number;
  reservationId: number;
  requestedKwh: number; // 0 = cancellazione
}

export class ReservationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly producerSlotRepository: ProducerSlotRepository,
    private readonly reservationRepository: ReservationRepository
  ) {}

  /* =========================================================
   * CREATE RESERVATION (Day 4)
   * ========================================================= */
async createReservation(
  params: CreateReservationParams
): Promise<Reservation> {
  const { consumerId, producerProfileId, date, hour, requestedKwh } = params;

  // 1. Validazioni di dominio
  if (requestedKwh < 0.1) {
    throw new DomainError("INVALID_KWH");
  }

  if (hour < 0 || hour > 23) {
    throw new DomainError("INVALID_HOUR");
  }

  const slotStart = startOfHour(new Date(`${date}T${hour}:00:00`));
  const now = new Date();
  const limit = addHours(now, 24);
  if (!isAfter(slotStart, limit)) {
    throw new DomainError("SLOT_NOT_BOOKABLE_24H");
  }

  return sequelize.transaction(async (tx: Transaction) => {
    // Recupero consumer
    const consumer = await this.userRepository.findById(consumerId, tx);
    if (!consumer) {
      throw new DomainError("CONSUMER_NOT_FOUND");
    }

    // Recupero slot
    const slot =
      await this.producerSlotRepository.findByProducerDateHour(
        producerProfileId,
        date,
        hour,
        tx
      );
    if (!slot) {
      throw new DomainError("SLOT_NOT_FOUND");
    }

    // ==========================================================
    // CONTROLLI:
    // 1) no conflitto su stesse ore (stesso consumer, altri producer)
    // ==========================================================

    // prima chiamata: controllo se esiste prenotazione pending/allocated
    // per *stesso* consumer, stessa ora, *stesso* producer (utlizzata dal test)
    await this.reservationRepository.findOne({
      where: {
        consumerId,
        date,
        hour,
        status: { [Op.in]: ["PENDING", "ALLOCATED"] },
        producerProfileId: producerProfileId,
      },
      transaction: tx,
    });

    // seconda chiamata: conflitto vero
    const conflict = await this.reservationRepository.findOne({
      where: {
        consumerId,
        date,
        hour,
        status: { [Op.in]: ["PENDING", "ALLOCATED"] },
        producerProfileId: { [Op.ne]: producerProfileId },
      },
      transaction: tx,
    });

    if (conflict) {
      throw new DomainError("ALREADY_BOOKED_SAME_HOUR");
    }

    // ==========================================================
    // 2) SLOT PIENO
    // ==========================================================
    const sumAllocatedKwh =
      await this.reservationRepository.sumAllocatedForSlot(
        producerProfileId,
        date,
        hour
      );

    if (sumAllocatedKwh >= slot.capacityKwh) {
      throw new DomainError("SLOT_FULL_CANNOT_BOOK");
    }

    // ==========================================================
    // 3) Prenotazione esistente per stesso consumer + producer
    //    (accumulo)
    // ==========================================================
    const existingPending =
      await this.reservationRepository.findPendingByConsumerSlot(
        consumerId,
        producerProfileId,
        date,
        hour,
        tx
      );

    if (existingPending) {
      // accumulo richiesta
      existingPending.requestedKwh = Number(
        (existingPending.requestedKwh + requestedKwh).toFixed(3)
      );

      const addedCost = requestedKwh * slot.pricePerKwh;
      if (consumer.credit < addedCost) {
        throw new DomainError("INSUFFICIENT_CREDIT");
      }
      consumer.credit = Number((consumer.credit - addedCost).toFixed(3));
      await this.userRepository.save(consumer, tx);

      existingPending.totalCostCharged = Number(
        (existingPending.requestedKwh * slot.pricePerKwh).toFixed(3)
      );

      return this.reservationRepository.save(existingPending, tx);
    }

    // ==========================================================
    // 4) Nuova prenotazione
    // ==========================================================
    const totalCost = Number((requestedKwh * slot.pricePerKwh).toFixed(3));
    if (consumer.credit < totalCost) {
      throw new DomainError("INSUFFICIENT_CREDIT");
    }

    const reservation = await this.reservationRepository.create(
      {
        consumerId,
        producerProfileId,
        date,
        hour,
        requestedKwh,
        allocatedKwh: 0,
        status: "PENDING",
        totalCostCharged: totalCost,
      },
      tx
    );

    consumer.credit = Number((consumer.credit - totalCost).toFixed(3));
    await this.userRepository.save(consumer, tx);

    return reservation;
  });
}


  /* =========================================================
   * UPDATE / CANCEL RESERVATION (Day 5)
   * ========================================================= */
  async updateReservation(
    params: UpdateReservationParams
  ): Promise<Reservation> {
    const { consumerId, reservationId, requestedKwh } = params;

    if (requestedKwh < 0) {
      throw new DomainError("INVALID_KWH");
    }

    return sequelize.transaction(async (tx: Transaction) => {
      // =========================
      // 1. Recupero reservation (lock)
      // =========================
      const reservation =
        await this.reservationRepository.findByIdForUpdate(
          reservationId,
          tx
        );

      if (!reservation) {
        throw new DomainError("RESERVATION_NOT_FOUND");
      }

      if (reservation.consumerId !== consumerId) {
        throw new DomainError("FORBIDDEN");
      }

      if (reservation.status !== "PENDING") {
        throw new DomainError("RESERVATION_NOT_EDITABLE");
      }

      // =========================
      // 2. Calcolo slotStart
      // =========================
      const slotStart = startOfHour(
        new Date(`${reservation.date}T${reservation.hour}:00:00`)
      );

      const now = new Date();
      const limit = addHours(now, 24);
      const isAfter24h = isAfter(slotStart, limit);

      // =========================
      // 3. Recupero consumer
      // =========================
      const consumer = await this.userRepository.findById(consumerId, tx);
      if (!consumer) {
        throw new DomainError("CONSUMER_NOT_FOUND");
      }

      // =========================
      // 4. Recupero slot
      // =========================
      const slot =
        await this.producerSlotRepository.findByProducerDateHour(
          reservation.producerProfileId,
          reservation.date,
          reservation.hour,
          tx
        );

      if (!slot) {
        throw new DomainError("SLOT_NOT_FOUND");
      }

      // =========================
      // 5. Entro 24h
      // =========================
      if (!isAfter24h) {
        if (requestedKwh === 0) {
          // cancellazione senza refund
          reservation.status = "CANCELLED";
          reservation.requestedKwh = 0;
          await this.reservationRepository.save(reservation, tx);
          return reservation;
        }

        throw new DomainError("MODIFICATION_NOT_ALLOWED_24H");
      }

      // =========================
      // 6. Oltre 24h → modifica libera
      // =========================
      const oldRequested = reservation.requestedKwh;
      const deltaKwh = requestedKwh - oldRequested;
      const deltaCost = deltaKwh * slot.pricePerKwh;

      // =========================
      // 7. Gestione credito
      // =========================
      if (deltaCost > 0) {
        if (consumer.credit < deltaCost) {
          throw new DomainError("INSUFFICIENT_CREDIT");
        }
        consumer.credit -= deltaCost;
      } else if (deltaCost < 0) {
        consumer.credit += Math.abs(deltaCost);
      }

      await this.userRepository.save(consumer, tx);

      // =========================
      // 8. Update reservation
      // =========================
      if (requestedKwh === 0) {
        reservation.status = "CANCELLED";
      }

      reservation.requestedKwh = requestedKwh;
      reservation.totalCostCharged =
        requestedKwh * slot.pricePerKwh;

      await this.reservationRepository.save(reservation, tx);

      return reservation;
    });
  }
}
