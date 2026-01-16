import ProducerSlot from "../models/ProducerSlot";
import { ProducerSlotRepository } from "../repositories/ProducerSlotRepository";
import { ProducerSlotService } from "./ProducerSlotService";

// Istanzia repository e service
const producerSlotRepository = new ProducerSlotRepository({
  producerSlotModel: ProducerSlot,
});

// Esporta l’istanza che userai nei controller
export const producerSlotService = new ProducerSlotService({
  producerSlotRepository,
});
