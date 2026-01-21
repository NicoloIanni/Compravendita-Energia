import { ReservationRepository } from "../repositories/ReservationRepository";
import Reservation from "../models/Reservation";
import { calcStats } from "../stats.utils";

export class ProducerStatsService {
  constructor(private reservationRepo: ReservationRepository) {}

  /* =========================
   * EARNINGS
   * ========================= */
  async getEarnings(input: {
    producerProfileId: number;
    from?: Date;
    to?: Date;
  }) {
    const reservations: Reservation[] =
      await this.reservationRepo.findAllocatedByProducer(input);

    const totalEarnings = reservations.reduce((sum, r) => {
      const price = (r as any).ProducerSlot.pricePerKwh;
      return sum + r.allocatedKwh * price;
    }, 0);

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
    const reservations: Reservation[] =
      await this.reservationRepo.findAllocatedByProducer(input);

    /**
     * slotKey = date-hour
     */
    const slotMap = new Map<
      string,
      {
        hour: number;
        capacity: number;
        sold: number;
      }
    >();

    for (const r of reservations) {
      const slot = (r as any).ProducerSlot;
      const key = `${r.date}-${r.hour}`;

      if (!slotMap.has(key)) {
        slotMap.set(key, {
          hour: r.hour,
          capacity: slot.capacityKwh,
          sold: 0,
        });
      }

      slotMap.get(key)!.sold += r.allocatedKwh;
    }

    /**
     * percentuali per fascia oraria
     */
    const hourPercentages = new Map<number, number[]>();

    for (const slot of slotMap.values()) {
      const percent =
        slot.capacity > 0 ? (slot.sold / slot.capacity) * 100 : 0;

      if (!hourPercentages.has(slot.hour)) {
        hourPercentages.set(slot.hour, []);
      }

      hourPercentages.get(slot.hour)!.push(percent);
    }

    /**
     * stats finali
     */
    const result: Record<number, any> = {};

    for (const [hour, values] of hourPercentages.entries()) {
      result[hour] = calcStats(values);
    }

    return result;
  }
}
