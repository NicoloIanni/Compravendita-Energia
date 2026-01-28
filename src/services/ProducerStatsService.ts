import { ReservationRepository } from "../repositories/ReservationRepository";
import { ProducerSlotRepository } from "../repositories/ProducerSlotRepository";
import { calcStats } from "../stats.utils";

// Funzione di utilità per normalizzare una data
// Se arriva già come stringa (YYYY-MM-DD) la ritorna così com’è
// Se arriva come Date, la converte in formato YYYY-MM-DD
function normalizeDate(d: string | Date): string {
  return typeof d === "string"
    ? d
    : d.toISOString().slice(0, 10);
}

// Service responsabile di statistiche ed earnings del producer
// Non modifica dati: solo lettura ed aggregazione
export class ProducerStatsService {
  constructor(
    // Repository delle reservation (vendite effettive)
    private reservationRepo: ReservationRepository,

    // Repository degli slot (capacità dichiarata)
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
    // Recupera tutte le reservation ALLOCATED del producer nel range
    const reservations =
      await this.reservationRepo.findAllocatedByProducer(input);

    // Somma dei ricavi:
    // totalCostCharged è già il valore finale dopo eventuali tagli
    const totalEarnings = reservations.reduce(
      (sum, r) => sum + (r.totalCostCharged ?? 0),
      0
    );

    // Ritorna periodo e totale incassato
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
    fromDate?: Date;
    toDate?: Date;
    fromHour?: number;
    toHour?: number;
  }) {
    const {
      producerProfileId,
      fromDate,
      toDate,
      fromHour,
      toHour,
    } = input;

    // Converte le date in stringa YYYY-MM-DD (se presenti)
    // NOTA: qui servono solo per coerenza logica,
    // il repository lavora già correttamente con Date
    const fromDateStr = fromDate
      ? fromDate.toISOString().slice(0, 10)
      : undefined;
    const toDateStr = toDate
      ? toDate.toISOString().slice(0, 10)
      : undefined;

    // Recupera tutte le reservation ALLOCATED del producer nel periodo
    const reservations =
      await this.reservationRepo.findAllocatedByProducer({
        producerProfileId,
        from: fromDate,
        to: toDate,
      });

    // Recupera tutti gli slot del producer nel periodo
    // Servono per conoscere la CAPACITÀ disponibile per ogni ora
    const slots =
      await this.producerSlotRepo.findByProducerAndRangeForStats({
        producerProfileId,
        from: fromDate,
        to: toDate,
      });

    // Mappa: "YYYY-MM-DD-hour" → capacityKwh
    // Serve per calcolare la percentuale venduta
    const capacityMap = new Map<string, number>();
    for (const s of slots) {
      capacityMap.set(`${s.date}-${s.hour}`, s.capacityKwh);
    }

    // Struttura dati:
    // data → (ora → array di percentuali vendute)
    const soldPercentMap = new Map<string, Map<number, number[]>>();

    for (const r of reservations) {
      // Filtro opzionale per fascia oraria
      if (fromHour !== undefined && r.hour < fromHour) continue;
      if (toHour !== undefined && r.hour > toHour) continue;

      const key = `${r.date}-${r.hour}`;

      // Recupera capacità dello slot
      const capacity = capacityMap.get(key) ?? 0;
      if (capacity === 0) continue; // evita divisioni inutili

      // Percentuale venduta in questo slot
      const percent = (r.allocatedKwh / capacity) * 100;

      // Inizializza struttura per la data se non esiste
      if (!soldPercentMap.has(r.date)) {
        soldPercentMap.set(r.date, new Map());
      }

      const hourMap = soldPercentMap.get(r.date)!;

      // Inizializza array per l’ora se non esiste
      if (!hourMap.has(r.hour)) {
        hourMap.set(r.hour, []);
      }

      // Aggiunge la percentuale a quell’ora
      hourMap.get(r.hour)!.push(percent);
    }

    // Output finale:
    // per ogni data → stats per ogni ora
    const result: Array<{
      date: string;
      slots: Array<{
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
        // Calcola min / max / avg / deviazione standard
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
        slots: hoursStats.sort((a, b) => a.hour - b.hour),
      });
    }

    // Ordina per data crescente
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }
}
