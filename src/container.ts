import User from "./models/User";
import ProducerSlot from "./models/ProducerSlot";
import Reservation from "./models/Reservation";

import { UserRepository } from "./repositories/UserRepository";
import { ProducerSlotRepository } from "./repositories/ProducerSlotRepository";
import { ReservationRepository } from "./repositories/ReservationRepository";
import { ReservationService } from "./services/ReservationService";
import { SettlementService } from "./services/SettlementService";
import { ConsumerQueryService } from "./services/ConsumerQueryService";
import { ProducerStatsService } from "./services/ProducerStatsService";


// Repository
const userRepository = new UserRepository();
const producerSlotRepository = new ProducerSlotRepository({
  producerSlotModel: ProducerSlot,
});
const reservationRepository = new ReservationRepository();

// Service
export const reservationService = new ReservationService(
  userRepository,
  producerSlotRepository,
  reservationRepository
);

export const settlementService = new SettlementService(
  userRepository,
  producerSlotRepository,
  reservationRepository
);
export const consumerQueryService = new ConsumerQueryService(
  reservationRepository
);

export const producerStatsService = new ProducerStatsService(
  reservationRepository
, producerSlotRepository
);

