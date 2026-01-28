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
  ) { }

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

      // Payload richiesto dal client
      const { producerProfileId, date, hour, requestedKwh } = req.body;

      // Chiamata al service
      const reservation = await this.reservationService.createReservation({
        consumerId,
        producerProfileId,
        date,
        hour,
        requestedKwh,
      });

      return res.status(201).json({
        id: reservation.id,
        consumerId: reservation.consumerId,
        producerProfileId: reservation.producerProfileId,
        date: reservation.date,
        hour: reservation.hour,
        requestedKwh: reservation.requestedKwh,
        allocatedKwh: reservation.allocatedKwh,
        status: reservation.status,
        totalCostCharged: reservation.totalCostCharged,
      });
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
        return res.status(400).json({ error: "L'id della prenotazione e` errato" });
      }

      if (typeof requestedKwh !== "number") {
        return res.status(400).json({ error: "La quantità di energia richiesta deve essere un numero (kWh)" });
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
   * - intervallo temporale from/to
   *
   * Output atteso: lista acquisti (dipende dal service).
   */
  getMyPurchases = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const consumerId = req.user!.userId;

      /**
       * Filtri supportati:
       * - producerId
       * - energyType
       * - fromDate / toDate  → (YYYY-MM-DD)
       * - fromHour / toHour  → (0–23)
       */
      const {
        producerId,
        energyType,
        fromDate,
        toDate,
        fromHour,
        toHour,
      } = req.query;

      // =========================
      // Parse date
      // =========================
      let fromDt: string | undefined;
      let toDt: string | undefined;

      if (fromDate && typeof fromDate === "string") {
        // semplice validazione formato YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
          return res.status(400).json({ error: "fromDate deve essere nel formato YYYY-MM-DD" });
        }
        fromDt = fromDate;
      }

      if (toDate && typeof toDate === "string") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
          return res.status(400).json({ error: "toDate deve essere nel formato YYYY-MM-DD" });
        }
        toDt = toDate;
      }

      // Range date coerente
      if (fromDt && toDt && fromDt > toDt) {
        return res.status(400).json({ error: "La data di inizio deve essere precedente o uguale alla data di fine" });
      }

      // =========================
      // Parse hour
      // =========================
      let fromHr: number | undefined;
      let toHr: number | undefined;

      if (fromHour !== undefined) {
        fromHr = Number(fromHour);
        if (Number.isNaN(fromHr) || fromHr < 0 || fromHr > 23) {
          return res.status(400).json({ error: "fromHour deve essere un numero compreso tra 0 e 23" });
        }
      }

      if (toHour !== undefined) {
        toHr = Number(toHour);
        if (Number.isNaN(toHr) || toHr < 0 || toHr > 23) {
          return res.status(400).json({ error: "toHour deve essere un numero compreso tra 0 e 23" });
        }
      }

      // Range orario coerente
      if (fromHr !== undefined && toHr !== undefined && fromHr > toHr) {
        return res.status(400).json({ error: "fromHour deve essere minore o uguale a toHour" });
      }

      // =========================
      // Query service
      // =========================
      const result = await this.consumerQueryService.getPurchases({
        consumerId,
        producerProfileId: producerId ? Number(producerId) : undefined,
        energyType: energyType as string | undefined,
        fromDate: fromDt,
        toDate: toDt,
        fromHour: fromHr,
        toHour: toHr,
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
        return res.status(400).json({ error: "Le date devono essere valide e nel formato YYYY-MM-DD" });
      }

      if (fromDate && toDate && fromDate > toDate) {
        return res.status(400).json({ error: "La data di inizio deve essere precedente o uguale alla data di fine" });
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


