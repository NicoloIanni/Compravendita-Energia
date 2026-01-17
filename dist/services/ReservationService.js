"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationService = exports.DomainError = void 0;
const db_1 = require("../config/db");
const date_fns_1 = require("date-fns");
/**
 * Errori di dominio (verranno mappati dal middleware)
 */
class DomainError extends Error {
    constructor(message) {
        super(message);
        this.name = "DomainError";
    }
}
exports.DomainError = DomainError;
class ReservationService {
    constructor(userRepository, producerSlotRepository, reservationRepository) {
        this.userRepository = userRepository;
        this.producerSlotRepository = producerSlotRepository;
        this.reservationRepository = reservationRepository;
    }
    async createReservation(params) {
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
        const slotStart = (0, date_fns_1.startOfHour)(new Date(`${date}T${hour}:00:00`));
        const now = new Date();
        // Regola 24h: slot prenotabile solo se slotStart - now > 24h
        const limit = (0, date_fns_1.addHours)(now, 24);
        if (!(0, date_fns_1.isAfter)(slotStart, limit)) {
            throw new DomainError("SLOT_NOT_BOOKABLE_24H");
        }
        // =========================
        // 2. Transaction Sequelize
        // =========================
        return db_1.sequelize.transaction(async (tx) => {
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
            const slot = await this.producerSlotRepository.findByProducerDateHour(producerProfileId, date, hour, tx);
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
            const reservation = await this.reservationRepository.create({
                consumerId,
                producerProfileId,
                date,
                hour,
                requestedKwh,
                allocatedKwh: 0,
                status: "PENDING",
                totalCostCharged: totalCost,
            }, tx);
            // =========================
            // 8. Scalare credito
            // =========================
            consumer.credit -= totalCost;
            await this.userRepository.save(consumer, tx);
            return reservation;
        });
    }
}
exports.ReservationService = ReservationService;
