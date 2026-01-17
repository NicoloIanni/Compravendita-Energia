"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.producerSlotService = void 0;
const ProducerSlot_1 = __importDefault(require("../models/ProducerSlot"));
const ProducerSlotRepository_1 = require("../repositories/ProducerSlotRepository");
const ProducerSlotService_1 = require("./ProducerSlotService");
// Istanzia repository e service
const producerSlotRepository = new ProducerSlotRepository_1.ProducerSlotRepository({
    producerSlotModel: ProducerSlot_1.default,
});
// Esporta l’istanza che userai nei controller
exports.producerSlotService = new ProducerSlotService_1.ProducerSlotService({
    producerSlotRepository,
});
