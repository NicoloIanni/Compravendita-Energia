/**
 * Consumer Controller
 *
 * Gestisce tutte le operazioni eseguibili da un utente con ruolo CONSUMER:
 * - creazione prenotazioni
 * - modifica / cancellazione
 * - storico acquisti
 * - carbon footprint
 *
 */

import { Request, Response, NextFunction } from "express";
import { ReservationService } from "../services/ReservationService";
import { ConsumerQueryService } from "../services/ConsumerService";
import { ProducerService } from "../services/ProducerSlotService";
import { ProducerProfileRepository } from "../repositories/ProducerProfileRepository";
import { ProducerSlotRepository } from "../repositories/ProducerSlotRepository";
import ProducerSlot from "../models/ProducerSlot";
export class ConsumerReservationController {
  constructor(
    private readonly reservationService: ReservationService,
    private readonly consumerQueryService: ConsumerQueryService
  ) {}

  /**
   * POST /consumers/me/reservations
   *
   * Crea una prenotazione PENDING per un determinato slot (date+hour) e produttore.
   * Regole importanti (demandate al service):
   * - minimo 0.1 kWh
   * - regola 24h (prenotabile solo entro la finestra)
   * - scalare subito il credito (transaction)
   *
   * Response:
   * - 201 con la prenotazione creata
   * - errori demandati a middleware errorHandler
   */
  createReservation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // ID consumer preso dal JWT (req.user è popolato dal middleware auth)
      const consumerId = req.user!.userId;

      // payload richiesto
      const { producerProfileId, date, hour, requestedKwh } = req.body;

      const reservation = await this.reservationService.createReservation({
        consumerId,
        producerProfileId,
        date,
        hour,
        requestedKwh,
      });

      return res.status(201).json(reservation);
    } catch (err) {
      next(err);
    }
  };

  /**
   * PATCH /consumers/me/reservations/:id
   *
   * Modifica o cancella una prenotazione.
   * Convenzione: se requestedKwh === 0 => cancellazione.
   *
   * Regola 24h (demandata al service):
   * - cancellazione >24h => rimborso
   * - cancellazione <=24h => nessun rimborso (paghi tutto)
   */
  updateReservation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const consumerId = req.user!.userId;
      const reservationId = Number(req.params.id);
      const { requestedKwh } = req.body;

      // Validazione minima: id e kWh devono essere numeri
      if (Number.isNaN(reservationId)) {
        return res.status(400).json({ error: "INVALID_RESERVATION_ID" });
      }

      if (typeof requestedKwh !== "number") {
        return res.status(400).json({ error: "INVALID_KWH" });
      }

      await this.reservationService.updateReservation({
        consumerId,
        reservationId,
        requestedKwh,
      });

      if (requestedKwh === 0) {
        return res.status(200).json({
          message: "Reservation cancellata correttamente",
        });
      }

      return res.status(200).json({
        message: "Reservation modificata correttamente",
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /consumers/me/purchases
   *
   * Ritorna lo storico acquisti del consumer con filtri opzionali:
   * - producerId (in realtà nel service è trattato come producerProfileId)
   * - energyType
   * - intervallo temporale from/to (datetime parse con new Date)
   *
   * Output atteso: lista acquisti (dipende dal service).
   */
  getMyPurchases = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const consumerId = req.user!.userId;
      const { producerId, energyType, from, to } = req.query;

      // parse date (from/to includono anche ora, es: 2026-01-07 10:00:00)
      const fromDate = from ? new Date(from as string) : undefined;
      const toDate = to ? new Date(to as string) : undefined;

      // validazione formato date
      if ((from && isNaN(fromDate!.getTime())) || (to && isNaN(toDate!.getTime()))) {
        return res.status(400).json({ error: "INVALID_DATE_FORMAT" });
      }

      // range coerente
      if (fromDate && toDate && fromDate > toDate) {
        return res.status(400).json({ error: "from must be <= to" });
      }

      const result = await this.consumerQueryService.getPurchases({
        consumerId,
        producerProfileId: producerId ? Number(producerId) : undefined,
        energyType: energyType as string | undefined,
        from: fromDate,
        to: toDate,
      });

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /consumers/me/carbon
   *
   * Calcola carbon footprint del consumer in un intervallo temporale.
   * Il service dovrebbe restituire:
   * - dettaglio per slot
   * - totale (somma)
   *
   */
  getMyCarbon = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const consumerId = req.user!.userId;
      const { from, to } = req.query;

      const fromDate = from ? new Date(from as string) : undefined;
      const toDate = to ? new Date(to as string) : undefined;

      if ((from && isNaN(fromDate!.getTime())) || (to && isNaN(toDate!.getTime()))) {
        return res.status(400).json({ error: "INVALID_DATE_FORMAT" });
      }

      if (fromDate && toDate && fromDate > toDate) {
        return res.status(400).json({ error: "from must be <= to" });
      }

      const result = await this.consumerQueryService.getCarbonFootprint({
        consumerId,
        from: fromDate,
        to: toDate,
      });

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}

/**
 * GET /consumers/me/producers
 *
 * Endpoint “utility”: lista produttori e slot disponibili.
 */
const producerService = new ProducerService(
  new ProducerProfileRepository(),
  new ProducerSlotRepository({ producerSlotModel: ProducerSlot })
);

export const listProducersWithSlots = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { date } = req.query;

    // date opzionale: se non passato, il service può decidere default (es: domani)
    const results = await producerService.getAllWithSlots(date as string | undefined);

    return res.status(200).json(results);
  } catch (err) {
    next(err);
  }
};


