import bcrypt from "bcrypt";
import { sequelize } from "../db";

import { UserRepository } from "../repositories/UserRepository";
import { ProducerProfileRepository } from "../repositories/ProducerProfileRepository";
import { ProducerSlotRepository } from "../repositories/ProducerSlotRepository";
import User from "../models/User";
import ProducerProfile from "../models/ProducerProfile";


export class AdminService {
  constructor(
    private userRepo: UserRepository,
    private profileRepo: ProducerProfileRepository,
    private slotRepo: ProducerSlotRepository
  ) {}

  async createProducer(data: any) {
    const t = await sequelize.transaction();
    try {
      const {
        email,
        password,
        energyType,
        co2_g_per_kwh,
        slots = [],
      } = data;

      const passwordHash = await bcrypt.hash(password, 10);

      // 1️⃣ User (credit OBBLIGATORIO)
      const user = await this.userRepo.create(
        {
          email,
          passwordHash,
          role: "producer",
          credit: 0,
        },
        { transaction: t }
      );

      // 2️⃣ ProducerProfile
      const profile = await this.profileRepo.createProfile(
        {
          userId: user.id,
          energyType,
          co2_g_per_kwh,
        },
        { transaction: t }
      );

      // 3️⃣ Slots
      for (const slot of slots) {
        await this.slotRepo.createSlot(
          {
            producerProfileId: profile.id,
            date: new Date(slot.date),
            hour: slot.hour,
            capacityKwh: slot.capacityKwh,
            pricePerKwh: slot.pricePerKwh,
          },
          { transaction: t }
        );
      }

      await t.commit();
      return { userId: user.id };
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }

  async createConsumer(data: any) {
    const { email, password, credit } = data;

    const passwordHash = await bcrypt.hash(password, 10);

    const consumer = await this.userRepo.create({
      email,
      passwordHash,
      role: "consumer",
      credit,
    });

    return { userId: consumer.id };
  }
  async getAllProducers() {
    const producers = await User.findAll({
    where: { role: "producer" },
    include: [
      {
        model: ProducerProfile,
        attributes: ["id", "energyType", "co2_g_per_kwh"],
      },
    ],
  });

  return producers.map((u) => ({
    userId: u.id,
    producerProfileId: u.producerProfile?.id,
    email: u.email,
    energyType: u.producerProfile?.energyType,
    co2_g_per_kwh: u.producerProfile?.co2_g_per_kwh,
  }));
}

async getAllConsumers() {
  return this.userRepo.findByRole("consumer");
}

}
