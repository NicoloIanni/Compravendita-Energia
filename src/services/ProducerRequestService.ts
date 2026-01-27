import { Op } from "sequelize";
import ProducerSlot from "../models/ProducerSlot";
import Reservation from "../models/Reservation";

// DTO per overview richieste produttore
export type ProducerRequestOverview = {
  hour: number;
  capacityKwh: number;
  sumRequestedKwh: number;
  sumAllocatedKwh: number;
  occupancyPercent: number;
};

// Calcola l'overview delle richieste per produttore e data
export async function getProducerRequestsOverview(params: {
  producerProfileId: number;
  date: string;
  fromHour?: number;
  toHour?: number;
}): Promise<ProducerRequestOverview[]> {
  const {
    producerProfileId,
    date,
    fromHour = 0,
    toHour = 23,
  } = params;

  // =========================
  // VALIDAZIONE DOMINIO
  // =========================
  if (fromHour < 0 || toHour > 23 || fromHour > toHour) {
    throw new Error("Intervallo ore non valido");
  }

  // =========================
  // RECUPERO SLOT PRODUTTORE
  // =========================
  const slots = await ProducerSlot.findAll({
    where: {
      producerProfileId,
      date,
      hour: { [Op.between]: [fromHour, toHour] },
    },
    order: [["hour", "ASC"]],
  });

  const result: ProducerRequestOverview[] = [];

  for (const slot of slots) {
    const capacity = Number(slot.capacityKwh);

    // =========================
    // SOMMA RICHIESTE (PENDING + ALLOCATED)
    // Serve per il pre-resolve
    // =========================
    const sumRequested = await Reservation.sum("requestedKwh", {
      where: {
        producerProfileId,
        date,
        hour: slot.hour,
        status: { [Op.in]: ["PENDING", "ALLOCATED"] },
      },
    });
    const sumRequestedKwh = Number(sumRequested || 0);

    // =========================
    // SOMMA ALLOCATA (POST-RESOLVE)
    // =========================
    const sumAllocated = await Reservation.sum("allocatedKwh", {
      where: {
        producerProfileId,
        date,
        hour: slot.hour,
        status: "ALLOCATED",
      },
    });
    const sumAllocatedKwh = Number(sumAllocated || 0);

    // =========================
    // CALCOLO % OCCUPAZIONE
    // REGOLA:
    // - se allocated > 0 → uso allocated
    // - altrimenti → uso requested
    // =========================
    const usedKwh =
      sumAllocatedKwh > 0
        ? sumAllocatedKwh
        : sumRequestedKwh;

    const occupancyPercent =
      capacity > 0
        ? Number(((usedKwh / capacity) * 100).toFixed(2))
        : 0;

    // =========================
    // OUTPUT JSON
    // =========================
    result.push({
      hour: slot.hour,
      capacityKwh: capacity,
      sumRequestedKwh,
      sumAllocatedKwh,
      occupancyPercent,
    });
  }

  return result;
}
