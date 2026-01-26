import request from "supertest";
import bcrypt from "bcrypt";
import app from "../src/app";
import { sequelize } from "../src/db";
import User from "../src/models/User";
import ProducerProfile from "../src/models/ProducerProfile";
import ProducerSlot from "../src/models/ProducerSlot";

/**
 * TEST DI INTEGRAZIONE
 * Scenario:
 * - un consumer crea una reservation >24h
 * - poi riduce i kWh richiesti
 * - la differenza deve essere rimborsata
 */
describe("Consumer reservation update with refund (>24h)", () => {
  let consumer: User;
  let producerProfile: ProducerProfile;
  let reservationId: number;
  let token: string;

  beforeAll(async () => {

    // =========================
    // CREA PRODUCER
    // =========================
    const producerUser = await User.create({
      email: "producer@test.com",
      passwordHash: await bcrypt.hash("password", 10),
      role: "producer",
      credit: 0,
    });

    producerProfile = await ProducerProfile.create({
      userId: producerUser.id,
      energyType: "Fotovoltaico",
      co2_g_per_kwh: 40,
    });

    // =========================
    // CREA SLOT > 24h
    // =========================
    // slot nel futuro (48h)
    const now = new Date();
    now.setHours(now.getHours() + 48);
    const date = now.toISOString().slice(0, 10);
    const hour = 10;

    await ProducerSlot.create({
      producerProfileId: producerProfile.id,
      date,
      hour,
      capacityKwh: 20,
      pricePerKwh: 2,
      deleted: false,
    });

    // =========================
    // CREA CONSUMER
    // =========================
    const password = "password";
    consumer = await User.create({
      email: "consumer@test.com",
      passwordHash: await bcrypt.hash(password, 10),
      role: "consumer",
      credit: 100,
    });

    // =========================
    // LOGIN CONSUMER
    // =========================
    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        email: consumer.email,
        password,
      });

    token = loginRes.body.accessToken;

    // =========================
    // CREA RESERVATION (10 kWh)
    // =========================
    const createRes = await request(app)
      .post("/consumers/me/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        producerProfileId: producerProfile.id,
        date,
        hour,
        requestedKwh: 10,
      });

    expect(createRes.status).toBe(201);
    reservationId = createRes.body.id;
  });

  /**
   * TEST PRINCIPALE:
   * - riduzione dei kWh (da 10 a 6)
   * - costo iniziale: 10 * 2 = 20
   * - nuovo costo: 6 * 2 = 12
   * - refund atteso: 8
   */
  it("should refund credit when reducing requested kWh", async () => {
    const url = `/consumers/me/updatereservations/${reservationId}`;

    const res = await request(app)
      .patch(url)
      .set("Authorization", `Bearer ${token}`)
      .send({
        requestedKwh: 6,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Reservation modificata correttamente");

    // ricarico consumer dal DB
    const updatedConsumer = await User.findByPk(consumer.id);

    // credito finale:
    // 100 - 20 + 8 = 88
    expect(updatedConsumer).not.toBeNull();
    expect(updatedConsumer!.credit).toBe(88);
  });

  // =========================
  // CLEANUP
  // =========================
  afterAll(async () => {
    await ProducerSlot.destroy({ where: { producerProfileId: producerProfile.id } });
    await ProducerProfile.destroy({ where: { id: producerProfile.id } });
    await User.destroy({ where: { id: consumer.id } });
  });
});
