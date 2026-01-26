import { sequelize } from "../db";
import { addHours, isAfter, startOfHour } from "date-fns";

import type { Transaction } from "sequelize";
import Reservation from "../models/Reservation";

import { UserRepository } from "../repositories/UserRepository";
import { ProducerSlotRepository } from "../repositories/ProducerSlotRepository";
import { ReservationRepository } from "../repositories/ReservationRepository";
import { Op } from "sequelize";

// Costruisce una Date “locale” partendo da una stringa YYYY-MM-DD e un’ora 0–23
// Serve a calcolare lo start dello slot in modo deterministico (inizio ora)
function buildSlotDate(date: string, hour: number): Date {
  // parsing manuale per evitare ambiguità Date(string) e timezone
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7)) - 1; // JS month: 0–11
  const day = Number(date.slice(8, 10));

  // crea un Date locale con minuti/secondi/millis a 0
  return new Date(year, month, day, hour, 0, 0, 0);
}

/**
 * Errori di dominio (verranno mappati dal middleware)
 * Qui non si lanciano errori “tecnici” (DB down ecc.),
 * ma errori previsi dalle regole del dominio (24h, credito, ecc.)
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

/* =========================
 * CREATE 
 * ========================= */

// Parametri richiesti per creare una reservation
// date: string YYYY-MM-DD, hour: 0-23, requestedKwh >= 0.1
interface CreateReservationParams {
  consumerId: number;
  producerProfileId: number;
  date: string; // YYYY-MM-DD
  hour: number; // 0–23
  requestedKwh: number;
}

/* =========================
 * UPDATE / CANCEL 
 * ========================= */

// Parametri per modifica/cancellazione
// requestedKwh = 0 => cancellazione
interface UpdateReservationParams {
  consumerId: number;
  reservationId: number;
  requestedKwh: number; // 0 = cancellazione
}

// Service che contiene la logica business per prenotazioni e modifiche
export class ReservationService {
  constructor(
    // Repository user: serve per lock e aggiornamento credito
    private readonly userRepository: UserRepository,
    // Repository slot: serve per leggere capacità/prezzo e check soft-delete
    private readonly producerSlotRepository: ProducerSlotRepository,
    // Repository reservations: crea, legge, somma, salva con lock
    private readonly reservationRepository: ReservationRepository
  ) { }

  /* =========================================================
   * CREATE RESERVATION 
   * ========================================================= */

  // Crea una nuova prenotazione:
  // - valida input
  // - verifica vincolo 24h
  // - verifica conflitti “stessa ora”
  // - verifica credito
  // - scala credito in transaction
  // - crea reservation PENDING
  async createReservation(
    params: CreateReservationParams
  ): Promise<Reservation> {
    // Estrazione parametri per leggibilità
    const { consumerId, producerProfileId, date, hour, requestedKwh } = params;

    // 1) Validazioni di dominio: quantità minima 0.1 kWh
    if (requestedKwh < 0.1) {
      // Messaggio come codice errore (viene gestito dall’error handler)
      throw new DomainError("INVALID_KWH");
    }

    // Validazione dominio: ora nello slot 0–23
    if (hour < 0 || hour > 23) {
      throw new DomainError("INVALID_HOUR");
    }

    // Calcolo inizio slot (arrotondato all’inizio dell’ora)
    const slotStart = startOfHour(buildSlotDate(date, hour));
    const now = new Date();

    // limite: now + 24h
    // regola: lo slot è prenotabile solo se slotStart è DOPO now+24h
    const limit = addHours(now, 24);

    // Se slotStart non è dopo limit => non prenotabile
    if (!isAfter(slotStart, limit)) {
      throw new DomainError("SLOT_NOT_BOOKABLE_24H");
    }

    // Tutto il resto deve essere atomico (credito + reservation)
    return sequelize.transaction(async (tx: Transaction) => {
      // =========================
      // Recupero consumer
      // =========================
      const consumer = await this.userRepository.findById(consumerId, tx);
      if (!consumer) {
        throw new DomainError("CONSUMER_NOT_FOUND");
      }

      // =========================
      // Recupero slot per produttore/data/ora
      // =========================
      const slot =
        await this.producerSlotRepository.findByProducerDateHour(
          producerProfileId,
          date,
          hour,
          tx
        );

      // Slot non esiste
      if (!slot) {
        throw new DomainError("SLOT_NOT_FOUND");
      }

      // Slot soft-deleted => non prenotabile
      if ((slot as any).deleted) {
        throw new DomainError("SLOT_NOT_BOOKABLE");
      }

  
      // Controllo conflitto: stesso consumer + stessa data/ora,
      // ma produttore diverso => non permesso
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
        // regola: non puoi prenotare due produttori nella stessa ora
        throw new DomainError("ALREADY_BOOKED_SAME_HOUR");
      }


      // Se esiste già una PENDING del consumer verso lo stesso producer/slot,
      // invece di crearne una nuova, sommate le richieste (accumulo)
      const existingPending =
        await this.reservationRepository.findPendingByConsumerSlot(
          consumerId,
          producerProfileId,
          date,
          hour,
          tx
        );

      if (existingPending) {
        // Accumulo quantità richiesta
        existingPending.requestedKwh = Number(
          (existingPending.requestedKwh + requestedKwh).toFixed(3)
        );

        // Costo addizionale solo per la quantità aggiunta
        const addedCost = requestedKwh * slot.pricePerKwh;

        // Controllo credito sufficiente
        if (consumer.credit < addedCost) {
          throw new DomainError("INSUFFICIENT_CREDIT");
        }

        // Scala credito consumer
        consumer.credit = Number((consumer.credit - addedCost).toFixed(3));
        await this.userRepository.save(consumer, tx);

        // Aggiorna costo totale della reservation PENDING
        // (qui viene ricalcolato su totale requestedKwh, coerente)
        existingPending.totalCostCharged = Number(
          (existingPending.requestedKwh * slot.pricePerKwh).toFixed(3)
        );

        // Salva la reservation aggiornata
        return this.reservationRepository.save(existingPending, tx);
      }


      // Calcolo costo totale prenotazione
      const totalCost = Number((requestedKwh * slot.pricePerKwh).toFixed(3));

      // Verifica credito sufficiente
      if (consumer.credit < totalCost) {
        throw new DomainError("INSUFFICIENT_CREDIT");
      }

      // Creazione reservation PENDING, allocatedKwh=0 (verrà risolta dopo)
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

      // Scala credito consumer
      consumer.credit = Number((consumer.credit - totalCost).toFixed(3));
      await this.userRepository.save(consumer, tx);

      return reservation;
    });
  }


  // Modifica o cancella una reservation PENDING
  // Regola 24h:
  // - entro 24h: puoi solo cancellare (senza refund)
  // - oltre 24h: puoi modificare/cancellare con aggiustamento credito
  async updateReservation(
    params: UpdateReservationParams
  ): Promise<Reservation> {
    const { consumerId, reservationId, requestedKwh } = params;

    // Validazione input: quantità non negativa
    if (requestedKwh < 0) {
      throw new DomainError("INVALID_KWH");
    }

    return sequelize.transaction(async (tx: Transaction) => {
      // =========================
      // Recupero reservation (lock)
      // =========================

      // Lock pessimista sulla reservation: evita race conditions
      // (due update contemporanei sullo stesso record)
      const reservation =
        await this.reservationRepository.findByIdForUpdate(
          reservationId,
          tx
        );

      if (!reservation) {
        throw new DomainError("RESERVATION_NOT_FOUND");
      }

      // Sicurezza: solo il proprietario può modificare
      if (reservation.consumerId !== consumerId) {
        throw new DomainError("FORBIDDEN");
      }

      // Solo PENDING è modificabile (ALLOCATED è già finalizzata)
      if (reservation.status !== "PENDING") {
        throw new DomainError("RESERVATION_NOT_EDITABLE");
      }


      // Ricostruisce la data/ora dello slot della reservation
      const slotStart = startOfHour(
        buildSlotDate(reservation.date, reservation.hour)
      );

      const now = new Date();
      const limit = addHours(now, 24);

      // True se lo slot è oltre 24h => modifiche consentite
      const isAfter24h = isAfter(slotStart, limit);


      // Recupera consumer per aggiornare credito
      const consumer = await this.userRepository.findByIdForUpdate(consumerId, tx);
      if (!consumer) {
        throw new DomainError("CONSUMER_NOT_FOUND");
      }


      // Recupera slot per ricalcolare prezzo (deltaCost)
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

      // Se slot soft deleted: blocca modifiche
      if ((slot as any).deleted) {
        throw new DomainError("SLOT_NOT_BOOKABLE");
      }


      if (!isAfter24h) {
        // Entro 24h: cancellazione permessa ma senza refund
        if (requestedKwh === 0) {
          reservation.status = "CANCELLED";
          reservation.requestedKwh = 0;
          await this.reservationRepository.save(reservation, tx);
          return reservation;
        }

        // Entro 24h: modifiche vietate
        throw new DomainError("MODIFICATION_NOT_ALLOWED_24H");
      }


      // Delta tra nuova richiesta e vecchia
      const oldRequested = reservation.requestedKwh;
      const deltaKwh = requestedKwh - oldRequested;

      // Delta costo basato su prezzo dello slot
      const deltaCost = deltaKwh * slot.pricePerKwh;


      // Se deltaCost > 0: sto aumentando kWh => devo pagare di più
      if (deltaCost > 0) {
        if (consumer.credit < deltaCost) {
          throw new DomainError("INSUFFICIENT_CREDIT");
        }
        consumer.credit = Number((consumer.credit - deltaCost).toFixed(3));
      }
      // Se deltaCost < 0: sto diminuendo kWh => rimborso differenza
      else if (deltaCost < 0) {
        consumer.credit += Math.abs(deltaCost);
      }

      // Salva credito aggiornato
      await this.userRepository.save(consumer, tx);


      // Se requestedKwh=0 => cancellazione (oltre 24h)
      if (requestedKwh === 0) {
        reservation.status = "CANCELLED";
      }

      // Aggiorna quantità richiesta
      reservation.requestedKwh = requestedKwh;

      // Ricalcola costo totale coerente con nuova richiesta
      reservation.totalCostCharged = Number(
        (requestedKwh * slot.pricePerKwh).toFixed(3)
      );

      // Salva reservation
      await this.reservationRepository.save(reservation, tx);

      return reservation;
    });
  }
}
