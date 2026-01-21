import { ReservationRepository } from "../repositories/ReservationRepository";
import ProducerProfile from "../models/ProducerProfile";
import Reservation from "../models/Reservation";

export class ConsumerQueryService {
  constructor(private reservationRepo: ReservationRepository) {}

  /* =========================
   * PURCHASES
   * ========================= */
  async getPurchases(input: {
    consumerId: number;
    producerProfileId?: number;
    energyType?: string;
    from?: Date;
    to?: Date;
  }) {
    const reservations: Reservation[] =
      await this.reservationRepo.findAllocatedByConsumer(input);

    return reservations.map((r) => ({
      date: r.date,                 // YYYY-MM-DD
      hour: r.hour,                 // 0–23
      allocatedKwh: r.allocatedKwh,
      totalCost: r.totalCostCharged,
      producerProfileId: (r as any).ProducerProfile.id,
      energyType: (r as any).ProducerProfile.energyType,
    }));
  }

  /* =========================
   * CARBON FOOTPRINT
   * ========================= */
  async getCarbonFootprint(input: {
    consumerId: number;
    from?: Date;
    to?: Date;
  }) {
    const reservations: Reservation[] =
      await this.reservationRepo.findAllocatedByConsumer(input);

    const totalCo2_g = reservations.reduce((sum, r) => {
      const co2 = (r as any).ProducerProfile.co2_g_per_kwh;
      return sum + r.allocatedKwh * co2;
    }, 0);

    return {
      from: input.from,
      to: input.to,
      totalCo2_g,
    };
  }
}
