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

  // Validazione dominio su range orario
  if (fromHour < 0 || toHour > 23 || fromHour > toHour) {
    throw new Error("Intervallo ore non valido");
  }

  // Recupera slot del produttore
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

    // Somma richieste totali (PENDING + ALLOCATED)
    const sumRequested = await Reservation.sum("requestedKwh", {
      where: {
        producerProfileId,
        date,
        hour: slot.hour,
        status: { [Op.in]: ["PENDING", "ALLOCATED"] },
      },
    });
    const sumRequestedKwh = Number(sumRequested || 0);

    // Somma allocazioni effettive
    const sumAllocated = await Reservation.sum("allocatedKwh", {
      where: {
        producerProfileId,
        date,
        hour: slot.hour,
        status: "ALLOCATED",
      },
    });
    const sumAllocatedKwh = Number(sumAllocated || 0);

    // Percentuale occupazione basata sulle richieste
    const occupancyPercent =
      capacity > 0
        ? Number(((sumRequestedKwh / capacity) * 100).toFixed(2))
        : 0;

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
