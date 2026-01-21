import { ReservationRepository } from "../repositories/ReservationRepository";
import Reservation from "../models/Reservation";
import { calcStats } from "../stats.utils";
import { ProducerSlotRepository } from "../repositories/ProducerSlotRepository";


export class ProducerStatsService {
  constructor(
    private reservationRepo: ReservationRepository,
    private producerSlotRepo: ProducerSlotRepository
  ) { }

  /* =========================
   * EARNINGS
   * ========================= */
  async getEarnings(input: {
    producerProfileId: number;
    from?: Date;
    to?: Date;
  }) {
    const reservations = await this.reservationRepo.findAllocatedByProducer(input);

    const totalEarnings = reservations.reduce(
      (sum, r) => sum + (r.totalCostCharged ?? 0),
      0
    );

    return {
      from: input.from,
      to: input.to,
      totalEarnings,
    };
  }

  /* =========================
   * STATS
   * ========================= */
  async getStats(input: {
    producerProfileId: number;
    from?: Date;
    to?: Date;
  }) {
    const reservations = await this.reservationRepo.findAllocatedByProducer(input);
    const slots = await this.producerSlotRepo.findByProducerAndRange(input);

    // capacity per slot (date-hour)
    const capacityByKey = new Map<string, number>();
    for (const s of slots) {
      capacityByKey.set(`${s.date}-${s.hour}`, s.capacityKwh);
    }

    // sold per slot (date-hour)
    const soldByKey = new Map<string, { hour: number; sold: number }>();
    for (const r of reservations) {
      const key = `${r.date}-${r.hour}`;
      if (!soldByKey.has(key)) {
        soldByKey.set(key, { hour: r.hour, sold: 0 });
      }
      soldByKey.get(key)!.sold += r.allocatedKwh;
    }

    // percentuali per fascia oraria
    const hourPercentages = new Map<number, number[]>();

    for (const [key, soldObj] of soldByKey.entries()) {
      const capacity = capacityByKey.get(key) ?? 0;
      const percent = capacity > 0 ? (soldObj.sold / capacity) * 100 : 0;

      if (!hourPercentages.has(soldObj.hour)) {
        hourPercentages.set(soldObj.hour, []);
      }
      hourPercentages.get(soldObj.hour)!.push(percent);
    }

    // stats finali
    const result: Record<number, any> = {};
    for (const [hour, values] of hourPercentages.entries()) {
      result[hour] = calcStats(values);
    }

    return result;
  }
}