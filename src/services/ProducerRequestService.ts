import { Op } from "sequelize";
import ProducerSlot from "../models/ProducerSlot";
import Reservation from "../models/Reservation";

export type ProducerRequestOverview = {
  hour: number;
  capacityKwh: number;
  sumRequestedKwh: number;
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
    // ** somma delle richieste richieste **
    const sumRequested = await Reservation.sum("requestedKwh", {
      where: {
        producerProfileId,
        date,
        hour: slot.hour,
      },
    });

    const sumRequestedKwh = Number(sumRequested || 0);
    const capacity = Number(slot.capacityKwh);

    const occupancyPercent =
      capacity > 0
        ? Number(((sumRequestedKwh / capacity) * 100).toFixed(2))
        : 0;

    result.push({
      hour: slot.hour,
      capacityKwh: capacity,
      sumRequestedKwh,            // ← qui
      occupancyPercent,
    });
  }

  return result;
}