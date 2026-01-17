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
}
