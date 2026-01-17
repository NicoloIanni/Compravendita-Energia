import { Transaction } from "sequelize";
import Reservation from "../models/Reservation";

interface CreateReservationData {
  consumerId: number;
  producerProfileId: number;
  date: string;
  hour: number;
  requestedKwh: number;
  allocatedKwh: number;
  status: "PENDING" | "ALLOCATED" | "CANCELLED";
  totalCostCharged: number;
}

export class ReservationRepository {
  async create(
    data: CreateReservationData,
    tx?: Transaction
  ): Promise<Reservation> {
    return Reservation.create(data, { transaction: tx });
  }
}
