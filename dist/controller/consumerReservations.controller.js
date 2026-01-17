"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsumerReservationController = void 0;
class ConsumerReservationController {
    constructor(reservationService) {
        this.reservationService = reservationService;
        this.createReservation = async (req, res, next) => {
            try {
                const consumerId = req.user.userId; // preso dal JWT middleware
                const { producerProfileId, date, hour, requestedKwh } = req.body;
                const reservation = await this.reservationService.createReservation({
                    consumerId,
                    producerProfileId,
                    date,
                    hour,
                    requestedKwh,
                });
                return res.status(201).json(reservation);
            }
            catch (err) {
                next(err);
            }
        };
    }
}
exports.ConsumerReservationController = ConsumerReservationController;
