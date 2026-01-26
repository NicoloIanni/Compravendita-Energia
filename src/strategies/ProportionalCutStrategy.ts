import { AllocationStrategy } from "./AllocationStrategy";
import Reservation from "../models/Reservation";
import ProducerSlot from "../models/ProducerSlot";

// Strategia applicata in caso di oversubscription
// La capacità viene distribuita proporzionalmente
export class ProportionalCutStrategy implements AllocationStrategy {
  allocate(
    reservations: Reservation[],
    slot: ProducerSlot
  ): Map<number, number> {

    // Calcola il totale dei kWh richiesti
    const totalRequested = reservations.reduce(
      (sum, r) => sum + r.requestedKwh,
      0
    );

    // Rapporto di taglio:
    // quanto posso soddisfare rispetto alla domanda totale
    const ratio = slot.capacityKwh / totalRequested;

    // Mappa finale: reservationId -> allocatedKwh
    const allocations = new Map<number, number>();

    // Ogni prenotazione riceve una quota proporzionale
    for (const reservation of reservations) {
      allocations.set(
        reservation.id,
        reservation.requestedKwh * ratio
      );
    }

    return allocations;
  }
}
