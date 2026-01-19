import request from "supertest";
import jwt from "jsonwebtoken";

import app from "../src/app";
import { User, ProducerProfile, ProducerSlot } from "../src/models";

function generateProducerToken(userId: number, profileId: number) {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign(
    { userId, role: "producer", profileId },
    secret,
    { expiresIn: "1h" }
  );
}

describe("PATCH /producers/me/slots/capacity — Capacity API", () => {
  let producer: User;
  let producerProfile: ProducerProfile;
  let token: string;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(async () => {
    consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // 🔹 SOLO SEED
    const foundProducer = await User.findOne({ where: { role: "producer" } });
    if (!foundProducer) throw new Error("Seed producer not found");
    producer = foundProducer;

    const foundProfile = await ProducerProfile.findOne({
      where: { userId: producer.id },
    });
    if (!foundProfile) throw new Error("Seed producer profile not found");
    producerProfile = foundProfile;

    token = generateProducerToken(producer.id, producerProfile.id);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(async () => {
    // 🔹 pulisce SOLO gli slot di questo producer
    await ProducerSlot.destroy({
      where: { producerProfileId: producerProfile.id },
    });
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
    expect(slot!.capacityKwh).toBe(50);
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
      expect(slot!.capacityKwh).toBe(item.capacityKwh);
    }
  });

  it("400 — hour fuori range", async () => {
    const res = await request(app)
      .patch("/producers/me/slots/capacity")
      .set("Authorization", `Bearer ${token}`)
      .send([{ date: "2026-01-20", hour: 24, capacityKwh: 10 }]);

    expect(res.status).toBe(400);
  });

  it("400 — capacity negativa", async () => {
    const res = await request(app)
      .patch("/producers/me/slots/capacity")
      .set("Authorization", `Bearer ${token}`)
      .send([{ date: "2026-01-20", hour: 10, capacityKwh: -5 }]);

    expect(res.status).toBe(400);
  });

  it("400 — date mancante", async () => {
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
    const badToken = jwt.sign(
      { userId: producer.id, role: "consumer" },
      process.env.JWT_SECRET!
    );

    const res = await request(app)
      .patch("/producers/me/slots/capacity")
      .set("Authorization", `Bearer ${badToken}`)
      .send([{ date: "2026-01-20", hour: 10, capacityKwh: 20 }]);

    expect(res.status).toBe(403);
  });

  it("atomicità — nessun salvataggio se un record è invalido", async () => {
    const body = [
      { date: "2026-01-20", hour: 8, capacityKwh: 12 },
      { date: "2026-01-20", hour: 9, capacityKwh: -2 },
    ];

    const res = await request(app)
      .patch("/producers/me/slots/capacity")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);

    const slots = await ProducerSlot.findAll({
      where: { producerProfileId: producerProfile.id },
    });

    expect(slots.length).toBe(0);
  });
});
