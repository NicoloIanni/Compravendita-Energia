import  Reservation  from "../models/Reservation";

export interface AllocationStrategy {
  allocate(
    reservations: Reservation[],
    capacityKwh: number
  ): Map<number, number>;
}
