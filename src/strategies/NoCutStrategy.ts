import { AllocationStrategy } from "./AllocationStrategy";
import  Reservation  from "../models/Reservation";

export class NoCutStrategy implements AllocationStrategy {
  allocate(
    reservations: Reservation[],
    capacityKwh: number
  ): Map<number, number> {
    const result = new Map<number, number>();

    for (const r of reservations) {
      result.set(r.id, r.requestedKwh);
    }

    return result;
  }
}
