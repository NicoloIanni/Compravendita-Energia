import request from "supertest";
import app from "../src/app";
import bcrypt from "bcrypt";

import User from "../src/models/User";
import ProducerSlot from "../src/models/ProducerSlot";
import Reservation from "../src/models/Reservation";

describe("Consumer reservation cancellation without refund (<24h)", () => {
  let consumerToken: string;
  let consumerId: number;
  let reservationId: number;
  let creditAfterReservation: number;

  beforeAll(async () => {
    // 1️⃣ consumer seedato
    const consumer = await User.findOne({
  where: { email: "consumer@example.com" },
});
    if (!consumer) throw new Error("Seed consumer not found");
    consumerId = consumer.id;

    await consumer.update({
    passwordHash: await bcrypt.hash("consumer123", 10),
  });

    // 2️⃣ login
    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        email: consumer.email,
        password: "consumer123",
      });

    expect(loginRes.status).toBe(200);
    consumerToken = loginRes.body.accessToken;

    // 3️⃣ slot seedato
    const slot = await ProducerSlot.findOne();
    if (!slot) throw new Error("Seed slot not found");

    // 4️⃣ crea reservation (>24h)
    const createRes = await request(app)
      .post("/consumers/me/reservations")
      .set("Authorization", `Bearer ${consumerToken}`)
      .send({
        producerProfileId: slot.producerProfileId,
        date: slot.date,
        hour: slot.hour,
        requestedKwh: 1,
      });

    expect(createRes.status).toBe(201);
    reservationId = createRes.body.id;

    // 5️⃣ credito dopo prenotazione
    const afterCreate = await User.findByPk(consumerId);
    creditAfterReservation = afterCreate!.credit;

  });

  it("should NOT refund credit when cancelled within 24h", async () => {

      jest.useFakeTimers();
        const reservation = await Reservation.findByPk(reservationId);
  const slotStart = new Date(`${reservation!.date}T${reservation!.hour}:00:00`);
  const fakeNow = new Date(slotStart.getTime() - 60 * 60 * 1000);

  jest.setSystemTime(fakeNow);

    const cancelRes = await request(app)
      .patch(`/consumers/me/reservations/${reservationId}`)
      .set("Authorization", `Bearer ${consumerToken}`)
      .send({ requestedKwh: 0 });

    expect(cancelRes.status).toBe(200);

    const afterCancel = await User.findByPk(consumerId);
    expect(afterCancel!.credit).toBe(creditAfterReservation);
     jest.useRealTimers();
  });

});
