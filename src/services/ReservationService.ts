import { sequelize } from "../config/db";
import { addHours, isAfter, startOfHour } from "date-fns";

import type { Transaction } from "sequelize";
import type User from "../models/User";
import type ProducerSlot from "../models/ProducerSlot";
import type Reservation from "../models/Reservation";

import { UserRepository } from "../repositories/UserRepository";
import { ProducerSlotRepository } from "../repositories/ProducerSlotRepository";
import { ReservationRepository } from "../repositories/ReservationRepository";

/**
 * Errori di dominio (verranno mappati dal middleware)
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

interface CreateReservationParams {
  consumerId: number;
  producerProfileId: number;
  date: string; // YYYY-MM-DD
  hour: number; // 0–23
  requestedKwh: number;
}

export class ReservationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly producerSlotRepository: ProducerSlotRepository,
    private readonly reservationRepository: ReservationRepository
  ) {}

  async createReservation(
    params: CreateReservationParams
  ): Promise<Reservation> {
    const { consumerId, producerProfileId, date, hour, requestedKwh } = params;

    // =========================
    // 1. Validazioni di dominio
    // =========================

    if (requestedKwh < 0.1) {
      throw new DomainError("INVALID_KWH");
    }

    if (hour < 0 || hour > 23) {
      throw new DomainError("INVALID_HOUR");
    }

    const slotStart = startOfHour(new Date(`${date}T${hour}:00:00`));
    const now = new Date();

    // Regola 24h: slot prenotabile solo se slotStart - now > 24h
    const limit = addHours(now, 24);
    if (!isAfter(slotStart, limit)) {
      throw new DomainError("SLOT_NOT_BOOKABLE_24H");
    }

    // =========================
    // 2. Transaction Sequelize
    // =========================

    return sequelize.transaction(async (tx: Transaction) => {
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
      const slot = await this.producerSlotRepository.findByProducerDateHour(
        producerProfileId,
        date,
        hour,
        tx
      );

      if (!slot) {
        throw new DomainError("SLOT_NOT_FOUND");
      }

      // =========================
      // 5. Calcolo costo
      // =========================
      const totalCost = requestedKwh * slot.pricePerKwh;

      // =========================
      // 6. Check credito
      // =========================
      if (consumer.credit < totalCost) {
        throw new DomainError("INSUFFICIENT_CREDIT");
      }

      // =========================
      // 7. Creazione Reservation
      // =========================
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

      // =========================
      // 8. Scalare credito
      // =========================
      consumer.credit -= totalCost;
      await this.userRepository.save(consumer, tx);

      return reservation;
    });
  }
}
