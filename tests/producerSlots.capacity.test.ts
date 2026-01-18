import request from "supertest";
import { sequelize } from "../src/config/db";
import app from "../src/app"; // la tua app Express
import ProducerProfile from "../src/models/ProducerProfile";
import ProducerSlot from "../src/models/ProducerSlot";
import jwt from "jsonwebtoken";
import type { CreationAttributes } from "sequelize";
import { User } from '../src/models'; 

// ============================================
// Helper -> genera JWT producer con profileId
// ============================================
function generateProducerToken(profileId: number, userId: number) {
  const secret = process.env.JWT_SECRET || "testsecret";
  return jwt.sign(
    { userId, profileId, role: "producer" },
    secret,
    { expiresIn: "1h" }
  );
}

describe("PATCH /producers/me/slots/capacity — Capacity API", () => {
  let producerProfile: any;
  let token: string;
  let consoleErrorSpy: jest.SpyInstance;


  beforeAll(async () => {
      consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

      const user = await User.create({
    email: "prod@example.com",
    passwordHash: "fake", // se require
    role: "producer",
    credit: 100,
  });

    // Crea un profilo producer
    const profileData: CreationAttributes<ProducerProfile> = {
      userId: user.id,
      energyType: "Fotovoltaico",
      co2_g_per_kwh: 100,
    };


    
    producerProfile = await ProducerProfile.create(profileData);

    // JWT valido
    token = generateProducerToken(producerProfile.id, 10);
  });

  afterAll(async () => {
    consoleErrorSpy.mockRestore();
    await sequelize.close();
  });


  beforeEach(async () => {
    // pulisce gli slot
    await ProducerSlot.destroy({ where: {} });
  });

  it("200 OK — aggiorna capacity per slot singolo", async () => {
    const res = await request(app)
      .patch("/producers/me/slots/capacity")
      .set("Authorization", `Bearer ${token}`)
      .send([{ date: "2026-01-20", hour: 10, capacityKwh: 50 }]);

    expect(res.status).toBe(200);

    const slot = await ProducerSlot.findOne({
      where: {
        producerProfileId: producerProfile.id,
        date: "2026-01-20",
        hour: 10,
      },
    });

    expect(slot).not.toBeNull();
    expect(slot?.capacityKwh).toBe(50);
  });

  it("200 OK — batch multipli aggiornati", async () => {
    const body = [
      { date: "2026-01-20", hour: 8, capacityKwh: 12 },
      { date: "2026-01-20", hour: 9, capacityKwh: 22 },
      { date: "2026-01-20", hour: 10, capacityKwh: 32 },
    ];

    const res = await request(app)
      .patch("/producers/me/slots/capacity")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(200);

    for (const item of body) {
      const slot = await ProducerSlot.findOne({
        where: {
          producerProfileId: producerProfile.id,
          date: item.date,
          hour: item.hour,
        },
      });
      expect(slot?.capacityKwh).toBe(item.capacityKwh);
    }
  });

  it("400 — hour fuori range (>=24)", async () => {
    const res = await request(app)
      .patch("/producers/me/slots/capacity")
      .set("Authorization", `Bearer ${token}`)
      .send([{ date: "2026-01-20", hour: 24, capacityKwh: 10 }]);

    expect(res.status).toBe(400);
  });

  it("400 — hour fuori range (<0)", async () => {
    const res = await request(app)
      .patch("/producers/me/slots/capacity")
      .set("Authorization", `Bearer ${token}`)
      .send([{ date: "2026-01-20", hour: -1, capacityKwh: 10 }]);

    expect(res.status).toBe(400);
  });

  it("400 — capacity negativa", async () => {
    const res = await request(app)
      .patch("/producers/me/slots/capacity")
      .set("Authorization", `Bearer ${token}`)
      .send([{ date: "2026-01-20", hour: 10, capacityKwh: -5 }]);

    expect(res.status).toBe(400);
  });

  it("400 — campo date mancante", async () => {
    const res = await request(app)
      .patch("/producers/me/slots/capacity")
      .set("Authorization", `Bearer ${token}`)
      .send([{ hour: 10, capacityKwh: 15 }]);

    expect(res.status).toBe(400);
  });

  it("401 — senza token", async () => {
    const res = await request(app)
      .patch("/producers/me/slots/capacity")
      .send([{ date: "2026-01-20", hour: 10, capacityKwh: 20 }]);

    expect(res.status).toBe(401);
  });

  it("403 — ruolo non producer", async () => {
    const nonProducerToken = jwt.sign(
      { userId: 99, profileId: 99, role: "consumer" },
      process.env.JWT_SECRET || "testsecret"
    );

    const res = await request(app)
      .patch("/producers/me/slots/capacity")
      .set("Authorization", `Bearer ${nonProducerToken}`)
      .send([{ date: "2026-01-20", hour: 10, capacityKwh: 20 }]);

    expect(res.status).toBe(403);
  });

  it("atomicità — nessun salvataggio se un record è invalido", async () => {
    const body = [
      { date: "2026-01-20", hour: 8, capacityKwh: 12 },
      { date: "2026-01-20", hour: 9, capacityKwh: -2 }, // invalido
    ];

    const res = await request(app)
      .patch("/producers/me/slots/capacity")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);

    const slots = await ProducerSlot.findAll({
      where: { producerProfileId: producerProfile.id },
    });
    expect(slots.length).toBe(0); // niente inserito
  });
});
