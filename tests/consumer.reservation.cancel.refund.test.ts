import "../src/models";
import { sequelize } from "../src/db";
import request from "supertest";
import bcrypt from "bcrypt";

import User from "../src/models/User";
import ProducerProfile from "../src/models/ProducerProfile";
import ProducerSlot from "../src/models/ProducerSlot";
import Reservation from "../src/models/Reservation";

let app: any;

describe("Consumer reservation cancellation with refund (>24h)", () => {
  let token: string;
  let consumerId: number;
  let producerProfileId: number;
  let reservationId: number;
  let creditBefore: number;

  beforeAll(async () => {
    app = (await import("../src/app")).default;

    // consumer seedato
    const consumer = await User.findOne({
      where: { email: "consumer@example.com" },
    });
    if (!consumer) throw new Error("Seed consumer not found");

    consumerId = consumer.id;
       await consumer.update({
        passwordHash: await bcrypt.hash("consumer123", 10),
      });
    creditBefore = consumer.credit;

    // producer profile seedato
    const producerProfile = await ProducerProfile.findOne();
    if (!producerProfile) throw new Error("Seed producer profile not found");

    producerProfileId = producerProfile.id;

    // login
    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        email: "consumer@example.com",
        password: "consumer123",
      });

    expect(loginRes.status).toBe(200);
    token = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("should refund credit when reservation is cancelled before 24h", async () => {
    // slot seedato
    const slot = await ProducerSlot.findOne({
      where: { producerProfileId },
    });
    if (!slot) throw new Error("Seed producer slot not found");

    // crea prenotazione (>24h)
    const createRes = await request(app)
      .post("/consumers/me/reservations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        producerProfileId,
        date: slot.date,
        hour: slot.hour,
        requestedKwh: 1,
      });

    expect(createRes.status).toBe(201);
    reservationId = createRes.body.id;

    // cancella (>24h → rimborso)
    const cancelRes = await request(app)
      .patch(`/consumers/me/reservations/${reservationId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ requestedKwh: 0 });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.status).toBe("CANCELLED");

    const afterCancel = await User.findByPk(consumerId);
    expect(afterCancel!.credit).toBe(creditBefore);
  });
});
