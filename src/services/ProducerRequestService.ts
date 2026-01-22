import { Op } from "sequelize";
import ProducerSlot from "../models/ProducerSlot";
import Reservation from "../models/Reservation";

export type ProducerRequestOverview = {
  hour: number;
  capacityKwh: number;
  sumRequestedKwh: number;
  sumAllocatedKwh: number;
  occupancyPercent: number;
};

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

  if (fromHour < 0 || toHour > 23 || fromHour > toHour) {
    throw new Error("Intervallo ore non valido");
  }

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

    // somma delle richieste totali
    const sumRequested = await Reservation.sum("requestedKwh", {
      where: {
        producerProfileId,
        date,
        hour: slot.hour,
      },
    });
    const sumRequestedKwh = Number(sumRequested || 0);

    // somma degli kWh allocati (dopo resolve)
    const sumAllocated = await Reservation.sum("allocatedKwh", {
      where: {
        producerProfileId,
        date,
        hour: slot.hour,
        status: "ALLOCATED", // consideriamo solo gli ALLOCATED
      },
    });
    const sumAllocatedKwh = Number(sumAllocated || 0);

    // calcolo percentuale basato su allocati
    const occupancyPercent =
      capacity > 0
        ? Number(((sumAllocatedKwh / capacity) * 100).toFixed(2))
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
