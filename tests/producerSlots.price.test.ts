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

function generateConsumerToken(userId: number) {
  const secret = process.env.JWT_SECRET!;
  return jwt.sign(
    { userId, role: "consumer" },
    secret,
    { expiresIn: "1h" }
  );
}

describe("PATCH /producers/me/slots/price — Price API", () => {
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

  it("200 OK — aggiorna price per slot singolo", async () => {
    const body = [{ date: "2026-03-10", hour: 14, pricePerKwh: 25 }];

    const res = await request(app)
      .patch("/producers/me/slots/price")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(200);

    const slot = await ProducerSlot.findOne({
      where: {
        producerProfileId: producerProfile.id,
        date: body[0].date,
        hour: body[0].hour,
      },
    });

    expect(slot!.pricePerKwh).toBe(25);
  });

  it("200 OK — batch multipli aggiornati", async () => {
    const body = [
      { date: "2026-03-10", hour: 10, pricePerKwh: 30 },
      { date: "2026-03-11", hour: 11, pricePerKwh: 35 },
    ];

    const res = await request(app)
      .patch("/producers/me/slots/price")
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
      expect(slot!.pricePerKwh).toBe(item.pricePerKwh);
    }
  });

  it("400 — hour fuori range", async () => {
    const res = await request(app)
      .patch("/producers/me/slots/price")
      .set("Authorization", `Bearer ${token}`)
      .send([{ date: "2026-03-12", hour: 24, pricePerKwh: 10 }]);

    expect(res.status).toBe(400);
  });

  it("400 — price negativa", async () => {
    const res = await request(app)
      .patch("/producers/me/slots/price")
      .set("Authorization", `Bearer ${token}`)
      .send([{ date: "2026-03-12", hour: 10, pricePerKwh: -5 }]);

    expect(res.status).toBe(400);
  });

  it("400 — date mancante", async () => {
    const res = await request(app)
      .patch("/producers/me/slots/price")
      .set("Authorization", `Bearer ${token}`)
      .send([{ hour: 10, pricePerKwh: 10 }]);

    expect(res.status).toBe(400);
  });

  it("401 — senza token", async () => {
    const res = await request(app)
      .patch("/producers/me/slots/price")
      .send([{ date: "2026-03-10", hour: 10, pricePerKwh: 20 }]);

    expect(res.status).toBe(401);
  });

  it("403 — ruolo non producer", async () => {
    const badToken = generateConsumerToken(producer.id);

    const res = await request(app)
      .patch("/producers/me/slots/price")
      .set("Authorization", `Bearer ${badToken}`)
      .send([{ date: "2026-03-10", hour: 10, pricePerKwh: 25 }]);

    expect(res.status).toBe(403);
  });

  it("atomicità — nessun salvataggio se un record è invalido", async () => {
    const body = [
      { date: "2026-03-13", hour: 10, pricePerKwh: 10 },
      { date: "2026-03-13", hour: 28, pricePerKwh: 15 },
    ];

    const res = await request(app)
      .patch("/producers/me/slots/price")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);

    const slots = await ProducerSlot.findAll({
      where: { producerProfileId: producerProfile.id },
    });

    expect(slots.length).toBe(0);
  });
});
