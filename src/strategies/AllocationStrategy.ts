// src/strategies/AllocationStrategy.ts

import Reservation from "../models/Reservation";
import ProducerSlot from "../models/ProducerSlot";

export interface AllocationStrategy {
  allocate(
    reservations: Reservation[],
    slot: ProducerSlot
  ): Map<number, number>; // reservationId -> allocatedKwh
}
