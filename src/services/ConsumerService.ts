import { ReservationRepository } from "../repositories/ReservationRepository";
import Reservation from "../models/Reservation";
import { Op } from "sequelize";

// Service READ-ONLY per consumer
// Separato dal ReservationService per non mescolare write e query
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
    const { consumerId, producerProfileId, energyType, from, to } = input;

    // Si delega completamente il filtering al repository
    const reservations: any[] =
      await this.reservationRepo.findAllocatedByConsumer({
        consumerId,
        producerProfileId,
        energyType,
        from,
        to,
      });

    // Mapping DTO + calcolo CO₂ per acquisto
    return reservations.map((r) => {
      const co2_g =
        Number(r.allocatedKwh.toFixed(3)) *
        Number(r.producerProfile.co2_g_per_kwh.toFixed(3));

      return {
        date: r.date,
        hour: r.hour,
        requestedKwh: Number(r.requestedKwh.toFixed(3)),
        allocatedKwh: Number(r.allocatedKwh.toFixed(3)),
        totalCost: Number(r.totalCostCharged.toFixed(2)),
        status: r.status,
        producerProfileId: r.producerProfile.id,
        energyType: r.producerProfile.energyType,
        co2_g_per_kwh: Number(r.producerProfile.co2_g_per_kwh.toFixed(2)),
        co2_g: Number(co2_g.toFixed(2)),
      };
    });
  }

  /* =========================
   * CARBON FOOTPRINT 
   * ========================= */
  async getCarbonFootprint(input: {
    consumerId: number;
    from?: Date;
    to?: Date;
  }) {
    const reservations =
      await this.reservationRepo.findAllocatedByConsumer(input);

    const items = reservations.map((r) => {
      const producer = (r as any).producerProfile;
      const co2_g =
        Number((r.allocatedKwh * producer.co2_g_per_kwh).toFixed(2));

      return {
        date: r.date,
        hour: r.hour,
        allocatedKwh: Number(r.allocatedKwh.toFixed(2)),
        energyType: producer.energyType,
        co2_g_per_kwh: Number(producer.co2_g_per_kwh.toFixed(2)),
        co2_g,
      };
    });

    // Somma totale CO₂
    const totalCo2_g = Number(
      items.reduce((sum, i) => sum + i.co2_g, 0).toFixed(2)
    );

    return {
      from: input.from,
      to: input.to,
      items,
      totalCo2_g,
    };
  }
}
