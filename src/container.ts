import User from "./models/User";
import ProducerSlot from "./models/ProducerSlot";
import Reservation from "./models/Reservation";

import { UserRepository } from "./repositories/UserRepository";
import { ProducerSlotRepository } from "./repositories/ProducerSlotRepository";
import { ProducerProfileRepository } from "./repositories/ProducerProfileRepository";
import { ReservationRepository } from "./repositories/ReservationRepository";

import { ReservationService } from "./services/ReservationService";
import { SettlementService } from "./services/ResolveService";
import { ConsumerQueryService } from "./services/ConsumerService";
import { ProducerStatsService } from "./services/ProducerStatsService";
import { AdminService } from "./services/AdminService";
import { ProducerSlotService } from "./services/ProducerSlotService";

// =====================================================
// Dependency Injection manuale (container applicativo)
// =====================================================
// Questo file funge da "composition root":
// qui vengono istanziati repository e service
// e collegati tra loro una sola volta.

// =========================
// Repository
// =========================

// Repository utenti (User)
const userRepository = new UserRepository();

// Repository slot di produzione
// Viene iniettato esplicitamente il model Sequelize ProducerSlot
const producerSlotRepository = new ProducerSlotRepository({
  producerSlotModel: ProducerSlot,
});

// Repository profili produttori
const producerProfileRepository = new ProducerProfileRepository();

// Repository prenotazioni
const reservationRepository = new ReservationRepository();

// =========================
// Services
// =========================

// Service principale lato consumer per creare/modificare prenotazioni
// Incapsula tutta la logica di dominio (24h, credito, conflitti, ecc.)
export const reservationService = new ReservationService(
  userRepository,
  producerSlotRepository,
  reservationRepository
);

// Service di settlement (resolve giornaliero)
// Gestisce allocazioni, taglio proporzionale e refund
export const settlementService = new SettlementService(
  userRepository,
  producerSlotRepository,
  reservationRepository
);

// Service di sola lettura per consumer
// Usato per purchases e carbon footprint
export const consumerQueryService = new ConsumerQueryService(
  reservationRepository
);

// Service di statistiche ed earnings per producer
// Combina dati di reservation e slot
export const producerStatsService = new ProducerStatsService(
  reservationRepository,
  producerSlotRepository
);

// Service amministrativo
// Usato per creare producer / consumer e listing utenti
export const adminService = new AdminService(
  userRepository,
  producerProfileRepository,
  producerSlotRepository
);

// Istanza del service degli slot.
// Il service incapsula la logica di business e usa il repository
// per accedere al database.
export const producerSlotService = new ProducerSlotService({
  producerSlotRepository,
});
