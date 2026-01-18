import { Request, Response, NextFunction } from "express";
import { ReservationService } from "../services/ReservationService";

export class ConsumerReservationController {
  constructor(
    private readonly reservationService: ReservationService
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
}

