import request from "supertest";
import app from "../src/app";
import { ProducerProfile, ProducerSlot, User } from "../src/models";
import jwt from "jsonwebtoken";

function generateProducerToken(userId: number, profileId: number) {
  const secret = process.env.JWT_SECRET || "testsecret";
  return jwt.sign(
    { userId, role: "producer", profileId },
    secret
  );
}
function generateConsumerToken(userId: number) {
  const secret = process.env.JWT_SECRET || "testsecret";
  return jwt.sign(
    { userId, role: "consumer" },
    secret
  );
}

describe("PATCH /producers/me/slots/price — Price API (with token)", () => {
  let token: string;
  let producerProfile: any;

  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(async () => {
      consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});


    const user = await User.create({
      email: "prod@test.com",
      passwordHash: "fake",
      role: "producer",
      credit: 0,
    });

    producerProfile = await ProducerProfile.create({
      userId: user.id,
      energyType: "Fotovoltaico",
      co2_g_per_kwh: 100,
    });

    token = generateProducerToken(user.id, producerProfile.id);

  });
    
  afterAll(async () => {
    consoleErrorSpy.mockRestore();
  });

  it("200 OK — aggiorna price per slot singolo", async () => {
    const body = [
      { date: "2026-03-10", hour: 14, pricePerKwh: 25 },
    ];

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
    expect(slot?.pricePerKwh).toBe(body[0].pricePerKwh);
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
      expect(slot?.pricePerKwh).toBe(item.pricePerKwh);
    }
  });

  it("400 — hour fuori range (>=24)", async () => {
    const body = [{ date: "2026-03-12", hour: 24, pricePerKwh: 10 }];

    const res = await request(app)
      .patch("/producers/me/slots/price")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
  });

  it("400 — hour fuori range (<0)", async () => {
    const body = [{ date: "2026-03-12", hour: -1, pricePerKwh: 10 }];

    const res = await request(app)
      .patch("/producers/me/slots/price")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
  });

  it("400 — pricePerKwh negativa", async () => {
    const body = [{ date: "2026-03-12", hour: 10, pricePerKwh: -5 }];

    const res = await request(app)
      .patch("/producers/me/slots/price")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
  });

  it("400 — campo date mancante", async () => {
    const body = [{ hour: 10, pricePerKwh: 10 }];

    const res = await request(app)
      .patch("/producers/me/slots/price")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(400);
  });

  it("401 — senza token", async () => {
    const body = [{ date: "2026-03-10", hour: 10, pricePerKwh: 20 }];

    const res = await request(app)
      .patch("/producers/me/slots/price")
      .send(body);

    expect(res.status).toBe(401);
  });

  it("403 — ruolo non producer", async () => {
    const otherUser = await User.create({
      email: "user2@test.com",
      passwordHash: "fake2",
      role: "consumer",
      credit: 0,
    });
    const badToken = generateConsumerToken(otherUser.id);


    const body = [{ date: "2026-03-10", hour: 10, pricePerKwh: 25 }];

    const res = await request(app)
      .patch("/producers/me/slots/price")
      .set("Authorization", `Bearer ${badToken}`)
      .send(body);

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
    for (const item of slots) {
      expect(item.pricePerKwh).not.toBe(10);
    }
  });
});
