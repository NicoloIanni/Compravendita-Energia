"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reservationService = void 0;
const ProducerSlot_1 = __importDefault(require("./models/ProducerSlot"));
const UserRepository_1 = require("./repositories/UserRepository");
const ProducerSlotRepository_1 = require("./repositories/ProducerSlotRepository");
const ReservationRepository_1 = require("./repositories/ReservationRepository");
const ReservationService_1 = require("./services/ReservationService");
// Repository
const userRepository = new UserRepository_1.UserRepository();
const producerSlotRepository = new ProducerSlotRepository_1.ProducerSlotRepository({
    producerSlotModel: ProducerSlot_1.default,
});
const reservationRepository = new ReservationRepository_1.ReservationRepository();
// Service
exports.reservationService = new ReservationService_1.ReservationService(userRepository, producerSlotRepository, reservationRepository);
