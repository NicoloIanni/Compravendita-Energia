// src/strategies/ProportionalCutStrategy.ts

import { AllocationStrategy } from "./AllocationStrategy";
import Reservation from "../models/Reservation";
import ProducerSlot from "../models/ProducerSlot";

export class ProportionalCutStrategy implements AllocationStrategy {
  allocate(
    reservations: Reservation[],
    slot: ProducerSlot
  ): Map<number, number> {
    const totalRequested = reservations.reduce(
      (sum, r) => sum + r.requestedKwh,
      0
    );

    const ratio = slot.capacityKwh / totalRequested;
    const allocations = new Map<number, number>();

    for (const reservation of reservations) {
      allocations.set(
        reservation.id,
        reservation.requestedKwh * ratio
      );
    }

    return allocations;
  }
}
