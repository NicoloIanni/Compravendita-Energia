import Reservation from "../models/Reservation";
import ProducerSlot from "../models/ProducerSlot";

// Interfaccia comune per tutte le strategie di allocazione
// Definisce il contratto che ogni strategy deve rispettare
export interface AllocationStrategy {
  allocate(
    // Lista delle prenotazioni PENDING per uno slot
    reservations: Reservation[],

    // Slot di produzione (contiene capacityKwh e prezzo)
    slot: ProducerSlot
  ): Map<number, number>; 
  // Ritorna una mappa:
  // reservationId -> kWh allocati effettivamente
}
