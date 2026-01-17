"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationRepository = void 0;
const Reservation_1 = __importDefault(require("../models/Reservation"));
class ReservationRepository {
    async create(data, tx) {
        return Reservation_1.default.create(data, { transaction: tx });
    }
}
exports.ReservationRepository = ReservationRepository;
