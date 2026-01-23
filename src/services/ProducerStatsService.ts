import { ReservationRepository } from "../repositories/ReservationRepository";
import { ProducerSlotRepository } from "../repositories/ProducerSlotRepository";
import { calcStats } from "../stats.utils";

function normalizeDate(d: string | Date): string {
  return typeof d === "string"
    ? d
    : d.toISOString().slice(0, 10);
}

export class ProducerStatsService {
  constructor(
    private reservationRepo: ReservationRepository,
    private producerSlotRepo: ProducerSlotRepository
  ) {}

  /* =========================
   * EARNINGS
   * ========================= */
  async getEarnings(input: {
    producerProfileId: number;
    from?: Date;
    to?: Date;
  }) {
    const reservations =
      await this.reservationRepo.findAllocatedByProducer(input);

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
   * STATS PER FASCIA ORARIA
   * ========================= */
async getStats(input: {
  producerProfileId: number;
  from?: Date;
  to?: Date;
}) {
  const reservations = await this.reservationRepo.findAllocatedByProducer(input);
  const slots = await this.producerSlotRepo.findByProducerAndRange(input);

  /**
   * capacity[date][hour] = capacityKwh
   */
  const capacityMap = new Map<string, number>();

  for (const s of slots) {
    const key = `${s.date}-${s.hour}`;
    capacityMap.set(key, s.capacityKwh);
  }

  /**
   * soldPercent[date][hour] = number[]
   */
  const soldPercentMap = new Map<
    string,
    Map<number, number[]>
  >();

  for (const r of reservations) {
    const key = `${r.date}-${r.hour}`;
    const capacity = capacityMap.get(key) ?? 0;
    if (capacity === 0) continue;

    const percent = (r.allocatedKwh / capacity) * 100;

    if (!soldPercentMap.has(r.date)) {
      soldPercentMap.set(r.date, new Map());
    }

    const hourMap = soldPercentMap.get(r.date)!;

    if (!hourMap.has(r.hour)) {
      hourMap.set(r.hour, []);
    }

    hourMap.get(r.hour)!.push(percent);
  }

  /**
   * OUTPUT FINALE
   */
  const result: Array<{
    date: string;
    hours: Array<{
      hour: number;
      minPercent: number;
      maxPercent: number;
      avgPercent: number;
      stdDev: number;
    }>;
  }> = [];

  for (const [date, hourMap] of soldPercentMap.entries()) {
    const hoursStats = [];

    for (const [hour, values] of hourMap.entries()) {
      const stats = calcStats(values);
      if (!stats) continue;

      hoursStats.push({
        hour,
        minPercent: Number(stats.minPercent.toFixed(2)),
        maxPercent: Number(stats.maxPercent.toFixed(2)),
        avgPercent: Number(stats.avgPercent.toFixed(2)),
        stdDev: Number(stats.stdDev.toFixed(2)),
      });
    }

    result.push({
      date,
      hours: hoursStats.sort((a, b) => a.hour - b.hour),
    });
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}



}
