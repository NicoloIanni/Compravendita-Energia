import { Request, Response, NextFunction } from "express";
import { ReservationService } from "../services/ReservationService";
import { ConsumerQueryService } from "../services/ConsumerQueryService";


export class ConsumerReservationController {
  constructor(
    private readonly reservationService: ReservationService,
    private readonly consumerQueryService: ConsumerQueryService
  ) {}

  createReservation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const consumerId = req.user!.userId; // preso dal JWT middleware

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
    updateReservation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const consumerId = req.user!.userId;
      const reservationId = Number(req.params.id);
      const { requestedKwh } = req.body;

      if (Number.isNaN(reservationId)) {
        return res.status(400).json({ error: "INVALID_RESERVATION_ID" });
      }

      if (typeof requestedKwh !== "number") {
        return res.status(400).json({ error: "INVALID_KWH" });
      }

      const reservation =
        await this.reservationService.updateReservation({
          consumerId,
          reservationId,
          requestedKwh,
        });

      return res.status(200).json(reservation);
    } catch (err) {
      next(err);
    }
  };
  /**
 * GET /consumers/me/purchases
 */
  getMyPurchases = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const consumerId = req.user!.userId;
      const { producerId, energyType, from, to } = req.query;

      const fromDate = from ? new Date(from as string) : undefined;
      const toDate = to ? new Date(to as string) : undefined;

      if (
        (from && isNaN(fromDate!.getTime())) ||
        (to && isNaN(toDate!.getTime()))
      ) {
        return res.status(400).json({ error: "INVALID_DATE_FORMAT" });
      }

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

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /consumers/me/carbon
   */
  getMyCarbon = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const consumerId = req.user!.userId;
      const { from, to } = req.query;

      const fromDate = from ? new Date(from as string) : undefined;
      const toDate = to ? new Date(to as string) : undefined;

      if (
        (from && isNaN(fromDate!.getTime())) ||
        (to && isNaN(toDate!.getTime()))
      ) {
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

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}

