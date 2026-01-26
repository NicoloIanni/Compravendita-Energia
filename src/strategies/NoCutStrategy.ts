import { AllocationStrategy } from "./AllocationStrategy";
import Reservation from "../models/Reservation";
import ProducerSlot from "../models/ProducerSlot";

// Strategia applicata quando NON c'è oversubscription
// Tutte le richieste possono essere soddisfatte interamente
export class NoCutStrategy implements AllocationStrategy {
  allocate(
    reservations: Reservation[],
    slot: ProducerSlot
  ): Map<number, number> {

    // Mappa finale: reservationId -> allocatedKwh
    const allocations = new Map<number, number>();

    // Per ogni prenotazione assegno esattamente i kWh richiesti
    for (const reservation of reservations) {
      allocations.set(
        reservation.id,
        reservation.requestedKwh
      );
    }

    return allocations;
  }
}
