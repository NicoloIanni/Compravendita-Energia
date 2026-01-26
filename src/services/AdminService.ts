import bcrypt from "bcrypt";
import { sequelize } from "../db";

import { UserRepository } from "../repositories/UserRepository";
import { ProducerProfileRepository } from "../repositories/ProducerProfileRepository";
import { ProducerSlotRepository } from "../repositories/ProducerSlotRepository";
import User from "../models/User";
import ProducerProfile from "../models/ProducerProfile";

// Service applicativo per operazioni ADMIN
// Contiene logica di business, non accesso diretto al DB
export class AdminService {
  constructor(
    private userRepo: UserRepository,
    private profileRepo: ProducerProfileRepository,
    private slotRepo: ProducerSlotRepository
  ) {}

  // =========================
  // CREATE PRODUCER 
  // =========================
  async createProducer(data: any) {
    // Transazione esplicita: user + profile + slot devono essere atomici
    const t = await sequelize.transaction();
    try {
      const {
        email,
        password,
        energyType,
        co2_g_per_kwh,
        slots = [],
      } = data;

      // Hash della password prima del salvataggio
      const passwordHash = await bcrypt.hash(password, 10);

      // Creazione utente producer
      // credit obbligatorio anche se inizialmente 0
      const user = await this.userRepo.create(
        {
          email,
          passwordHash,
          role: "producer",
          credit: 0,
        },
        { transaction: t }
      );

      // Creazione profilo produttore
      const profile = await this.profileRepo.createProfile(
        {
          userId: user.id,
          energyType,
          co2_g_per_kwh,
        },
        { transaction: t }
      );

      // Creazione slot iniziali (opzionali)
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

      // Commit finale della transazione
      await t.commit();
      return { userId: user.id };
    } catch (err) {
      // Rollback completo in caso di errore
      await t.rollback();
      throw err;
    }
  }

  // =========================
  // CREATE CONSUMER 
  // =========================
  async createConsumer(data: any) {
    const { email, password, credit } = data;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Creazione consumer
    const consumer = await this.userRepo.create({
      email,
      passwordHash,
      role: "consumer",
      credit,
    });

    return { userId: consumer.id };
  }

  // =========================
  // VIEW PRODUCERS
  // =========================
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

    // Mappatura in DTO di risposta
    return producers.map((u) => ({
      userId: u.id,
      producerProfileId: u.producerProfile?.id,
      email: u.email,
      energyType: u.producerProfile?.energyType,
      co2_g_per_kwh: u.producerProfile?.co2_g_per_kwh,
    }));
  }

  // =========================
  // VIEW CONSUMERS
  // =========================
  async getAllConsumers() {
    const consumers = await this.userRepo.findByRole("consumer");

    // Normalizza il credito a 2 decimali
    return consumers.map(c => ({
      id: c.id,
      email: c.email,
      role: c.role,
      credit: Number(c.credit.toFixed(2))
    }));
  }
}
