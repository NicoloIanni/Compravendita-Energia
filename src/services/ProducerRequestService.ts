import { Op } from "sequelize";
import ProducerProfile from "../models/ProducerProfile";
import ProducerSlot from "../models/ProducerSlot";
import Reservation from "../models/Reservation";

export type ProducerRequestOverview = {
    hour: number;
    capacityKwh: number;
    sumRequestedKwh: number;
    occupancyPercent: number;
};

export async function getProducerRequestsOverview(params: {
    userId: number;
    date: string;
    fromHour?: number;
    toHour?: number;
}): Promise<ProducerRequestOverview[]> {
    const {
        userId,
        date,
        fromHour = 0,
        toHour = 23,
    } = params;

    if (fromHour < 0 || toHour > 23 || fromHour > toHour) {
        throw new Error("Intervallo ore non valido");
    }

    const profile = await ProducerProfile.findOne({
        where: { userId },
    });

    if (!profile) {
        throw new Error("ProducerProfile non trovato");
    }

    const slots = await ProducerSlot.findAll({
        where: {
            producerProfileId: profile.id,
            date,
            hour: { [Op.between]: [fromHour, toHour] },
        },
        order: [["hour", "ASC"]],
    });

    const result: ProducerRequestOverview[] = [];

    for (const slot of slots) {
        const sum = await Reservation.sum("requestedKwh", {
            where: {
                producerProfileId: profile.id,
                date,
                hour: slot.hour,
                status: "PENDING",
            },
        });

        const sumRequested = Number(sum || 0);
        const capacity = Number(slot.capacityKwh);

        const occupancyPercent =
            capacity > 0
                ? Number(((sumRequested / capacity) * 100).toFixed(2))
                : 0;

        result.push({
            hour: slot.hour,
            capacityKwh: capacity,
            sumRequestedKwh: sumRequested,
            occupancyPercent,
        });
    }

    return result;
}

/**
 * Wrapper class per coerenza con altri Service
 */
export class ProducerRequestsService {
    async getRequestsOverview(params: {
        userId: number;
        date: string;
        fromHour?: number;
        toHour?: number;
    }) {
        return getProducerRequestsOverview(params);
    }
}