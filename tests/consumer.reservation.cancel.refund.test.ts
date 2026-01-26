import request from "supertest";
import bcrypt from "bcrypt";

import app from "../src/app";
import User from "../src/models/User";
import ProducerProfile from "../src/models/ProducerProfile";
import ProducerSlot from "../src/models/ProducerSlot";
import Reservation from "../src/models/Reservation";

/**
 * TEST DI INTEGRAZIONE
 * Scenario:
 * - un consumer crea una reservation >24h
 * - poi la cancella (requestedKwh = 0)
 * - deve ricevere il refund completo del credito
 */
describe("Consumer reservation cancellation with refund (>24h)", () => {
  let consumer: User;
  let consumerToken: string;

  let producerUser: User;
  let producerProfile: ProducerProfile;
  let slot: ProducerSlot;

  let reservationId: number;
  let creditBeforeReservation: number;

  beforeAll(async () => {
    /* =========================
       CREA CONSUMER
       =========================
       - consumer con credito iniziale
       - password hashata come in produzione
    */
    consumer = await User.create({
      email: "consumer_refund@test.com",
      passwordHash: await bcrypt.hash("consumer123", 10),
      role: "consumer",
      credit: 100,
    } as any);

    /* =========================
       LOGIN CONSUMER
       =========================
       - JWT valido
       - usato nelle chiamate protette
    */
    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        email: consumer.email,
        password: "consumer123",
      });

    expect(loginRes.status).toBe(200);
    consumerToken = loginRes.body.accessToken;

    // viene salvato il credito iniziale per confronto finale
    creditBeforeReservation = consumer.credit;

    /* =========================
       CREA PRODUCER + PROFILE
       ========================= */
    producerUser = await User.create({
      email: "producer_refund@test.com",
      passwordHash: await bcrypt.hash("producer123", 10),
      role: "producer",
      credit: 0,
    } as any);

    producerProfile = await ProducerProfile.create({
      userId: producerUser.id,
      energyType: "Fotovoltaico",
      co2_g_per_kwh: 120,
    } as any);

    /* =========================
       CREA SLOT > 24h
       =========================
       - slot nel futuro (48h)
       - così la cancellazione è rimborsabile
    */
    const future = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const date = future.toISOString().split("T")[0];
    const hour = future.getHours();

    slot = await ProducerSlot.create({
      producerProfileId: producerProfile.id,
      date,
      hour,
      capacityKwh: 100,
      pricePerKwh: 10,
    } as any);

    /* =========================
       CREA RESERVATION
       ========================= */
    const createRes = await request(app)
      .post("/consumers/me/reservations")
      .set("Authorization", `Bearer ${consumerToken}`)
      .send({
        producerProfileId: producerProfile.id,
        date: slot.date,
        hour: slot.hour,
        requestedKwh: 1,
      });

    expect(createRes.status).toBe(201);
    reservationId = createRes.body.id;
  });

  /**
   * TEST PRINCIPALE:
   * - cancellazione con requestedKwh = 0
   * - oltre 24h → refund completo
   */
  it("should refund credit when reservation is cancelled before 24h (DEBUG)", async () => {
    const url = `/consumers/me/updatereservations/${reservationId}`;

    const cancelRes = await request(app)
      .patch(url)
      .set("Authorization", `Bearer ${consumerToken}`)
      .send({ requestedKwh: 0 });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.message).toBe(
      "Reservation cancellata correttamente"
    );

    // ricarico il consumer dal DB
    const afterCancel = await User.findByPk(consumer.id);

    // credito tornato ESATTAMENTE al valore iniziale
    expect(afterCancel!.credit).toBe(creditBeforeReservation);
  });

  /* =========================
     CLEANUP FINALE
     ========================= */
  afterAll(async () => {
    await Reservation.destroy({ where: { id: reservationId } });
    await ProducerSlot.destroy({ where: { producerProfileId: producerProfile.id } });
    await ProducerProfile.destroy({ where: { id: producerProfile.id } });
    await User.destroy({ where: { id: producerUser.id } });
    await User.destroy({ where: { id: consumer.id } });
  });
});
