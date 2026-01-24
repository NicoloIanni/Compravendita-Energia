// src/strategies/NoCutStrategy.ts

import { AllocationStrategy } from "./AllocationStrategy";
import Reservation from "../models/Reservation";
import ProducerSlot from "../models/ProducerSlot";

export class NoCutStrategy implements AllocationStrategy {
  allocate(
    reservations: Reservation[],
    slot: ProducerSlot
  ): Map<number, number> {
    const allocations = new Map<number, number>();

    for (const reservation of reservations) {
      allocations.set(reservation.id, reservation.requestedKwh);
    }

    return allocations;
  }
}
