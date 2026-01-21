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
      hour: r.hour,
      requestedKwh:r.requestedKwh,                // 0–23
      allocatedKwh: r.allocatedKwh,
      totalCost: r.totalCostCharged,
      status: r.status,
      producerProfileId: (r as any).producerProfile.id,
      energyType: (r as any).producerProfile.energyType,
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
    const reservations = await this.reservationRepo.findAllocatedByConsumer(input);

    const items = reservations.map((r) => {
      const producer = (r as any).producerProfile;
      const co2_g = r.allocatedKwh * producer.co2_g_per_kwh;

      return {
        date: r.date,
        hour: r.hour,
        allocatedKwh: r.allocatedKwh,
        energyType: producer.energyType,
        co2_g_per_kwh: producer.co2_g_per_kwh,
        co2_g,
      };
    });

    const totalCo2_g = items.reduce((sum, i) => sum + i.co2_g, 0);

    return {
      from: input.from,
      to: input.to,
      items,
      totalCo2_g,
    };
  }
}
