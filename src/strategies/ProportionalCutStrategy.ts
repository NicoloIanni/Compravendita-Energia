import { AllocationStrategy } from "./AllocationStrategy";
import  Reservation  from "../models/Reservation";

export class ProportionalCutStrategy implements AllocationStrategy {
  allocate(
    reservations: Reservation[],
    capacityKwh: number
  ): Map<number, number> {
    const result = new Map<number, number>();

    const totalRequested = reservations.reduce(
      (sum, r) => sum + r.requestedKwh,
      0
    );

    const ratio = capacityKwh / totalRequested;

    for (const r of reservations) {
      const allocated = Number((r.requestedKwh * ratio).toFixed(3));
      result.set(r.id, allocated);
    }

    return result;
  }
}
