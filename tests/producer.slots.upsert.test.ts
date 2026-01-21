import request from "supertest";
import bcrypt from "bcrypt";

import app from "../src/app";
import User from "../src/models/User";
import ProducerProfile from "../src/models/ProducerProfile";
import ProducerSlot from "../src/models/ProducerSlot";
jest.setTimeout(20000);


describe("Producer slot upsert (capacity + price mandatory)", () => {
  let producerUser: User;
  let producerProfile: ProducerProfile;
  let producerToken: string;

  beforeAll(async () => {
    /* =========================
       1️⃣ CREA PRODUCER
    ========================= */
    producerUser = await User.create({
      email: "producer_slot@test.com",
      passwordHash: await bcrypt.hash("producer123", 10),
      role: "producer",
      credit: 0,
    } as any);

    producerProfile = await ProducerProfile.create({
      userId: producerUser.id,
      energyType: "Fotovoltaico",
      co2_g_per_kwh: 100,
    } as any);

    /* =========================
       2️⃣ LOGIN PRODUCER
    ========================= */
    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        email: producerUser.email,
        password: "producer123",
      });

    expect(loginRes.status).toBe(200);
    producerToken = loginRes.body.accessToken;
  });

  it("should create slots when capacity and price are provided", async () => {
    const res = await request(app)
      .patch("/producers/me/slots")
      .set("Authorization", `Bearer ${producerToken}`)
      .send({
        date: "2026-01-22",
        slots: [
          { hour: 10, capacityKwh: 10, pricePerKwh: 2 },
          { hour: 11, capacityKwh: 8, pricePerKwh: 1.5 },
        ],
      });

    expect(res.status).toBe(200);

    const slots = await ProducerSlot.findAll({
      where: { producerProfileId: producerProfile.id },
    });

    expect(slots.length).toBe(2);
  });

  it("should update existing slot instead of creating duplicates", async () => {
    const res = await request(app)
      .patch("/producers/me/slots")
      .set("Authorization", `Bearer ${producerToken}`)
      .send({
        date: "2026-01-22",
        slots: [
          { hour: 10, capacityKwh: 20, pricePerKwh: 3 },
        ],
      });

    expect(res.status).toBe(200);

    const slot = await ProducerSlot.findOne({
      where: {
        producerProfileId: producerProfile.id,
        date: "2026-01-22",
        hour: 10,
      },
    });

    expect(slot).not.toBeNull();
    expect(slot!.capacityKwh).toBe(20);
    expect(slot!.pricePerKwh).toBe(3);
  });

  it("should fail if capacity or price is missing", async () => {
    const res = await request(app)
      .patch("/producers/me/slots")
      .set("Authorization", `Bearer ${producerToken}`)
      .send({
        date: "2026-01-22",
        slots: [
          { hour: 12, capacityKwh: 5 }, // ❌ manca pricePerKwh
        ],
      });

    expect(res.status).toBe(400);
  });

  afterAll(async () => {
    /* =========================
       CLEANUP
    ========================= */
    await ProducerSlot.destroy({
      where: { producerProfileId: producerProfile.id },
    });
    await ProducerProfile.destroy({ where: { id: producerProfile.id } });
    await User.destroy({ where: { id: producerUser.id } });
  });
});
