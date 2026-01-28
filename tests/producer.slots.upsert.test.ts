import request from "supertest";
import bcrypt from "bcrypt";

import app from "../src/app";
import User from "../src/models/User";
import ProducerProfile from "../src/models/ProducerProfile";
import ProducerSlot from "../src/models/ProducerSlot";
import { addHours, format } from "date-fns";


// aumento timeout perché il test usa DB reale
jest.setTimeout(20000);

/**
 * TEST DI INTEGRAZIONE
 * Verifica:
 * - creazione slot producer tramite upsert
 * - aggiornamento slot esistente (no duplicati)
 * - validazione campi obbligatori
 */
describe("Producer slot upsert (capacity + price mandatory)", () => {
  let producerUser: User;
  let producerProfile: ProducerProfile;
  let producerToken: string;

  const futureDate = format(addHours(new Date(), 48), "yyyy-MM-dd");


  beforeAll(async () => {
    /* =========================
       CREA PRODUCER
       ========================= */

    // creazione utente producer nel DB
    producerUser = await User.create({
      email: "producer_slot@test.com",
      passwordHash: await bcrypt.hash("producer123", 10),
      role: "producer",
      credit: 0,
    } as any);

    // creazione profilo producer associato
    producerProfile = await ProducerProfile.create({
      userId: producerUser.id,
      energyType: "Fotovoltaico",
      co2_g_per_kwh: 100,
    } as any);

    /* =========================
       LOGIN PRODUCER
       ========================= */

    // login tramite endpoint /auth/login
    const loginRes = await request(app)
      .post("/auth/login")
      .send({
        email: producerUser.email,
        password: "producer123",
      });

    // verifica login riuscito
    expect(loginRes.status).toBe(200);

    // salvataggio JWT per richieste successive
    producerToken = loginRes.body.accessToken;
  });

  /**
   * TEST 1
   * Creazione slot quando capacity e price sono forniti
   */
  it("should create slots when capacity and price are provided", async () => {

    // chiamata PATCH /producers/me/slots
    const res = await request(app)
      .patch("/producers/me/slots")
      .set("Authorization", `Bearer ${producerToken}`)
      .send({
        date: futureDate,
        slots: [
          { hour: 10, capacityKwh: 10, pricePerKwh: 2 },
          { hour: 11, capacityKwh: 8, pricePerKwh: 1.5 },
        ],
      });

    // verifica risposta OK
    expect(res.status).toBe(200);

    // verifica che gli slot siano stati creati nel DB
    const slots = await ProducerSlot.findAll({
      where: { producerProfileId: producerProfile.id },
    });

    // devono esistere due slot
    expect(slots.length).toBe(2);
  });

  /**
   * TEST 2
   * Aggiornamento slot esistente (upsert → UPDATE)
   */
  it("should update existing slot instead of creating duplicates", async () => {

    // stesso endpoint, stesso date+hour → deve fare UPDATE
    const res = await request(app)
      .patch("/producers/me/slots")
      .set("Authorization", `Bearer ${producerToken}`)
      .send({
        date: futureDate,
        slots: [
          { hour: 10, capacityKwh: 20, pricePerKwh: 3 },
        ],
      });

    // verifica risposta OK
    expect(res.status).toBe(200);

    // recupero slot aggiornato
    const slot = await ProducerSlot.findOne({
      where: {
        producerProfileId: producerProfile.id,
        date: futureDate,
        hour: 10,
      },
    });

    // verifica che lo slot esista
    expect(slot).not.toBeNull();

    // verifica aggiornamento valori
    expect(slot!.capacityKwh).toBe(20);
    expect(slot!.pricePerKwh).toBe(3);
  });

  /**
   * TEST 3
   * Validazione: capacity o price mancanti → 400
   */
  it("should fail if capacity or price is missing", async () => {

    // manca pricePerKwh
    const res = await request(app)
      .patch("/producers/me/slots")
      .set("Authorization", `Bearer ${producerToken}`)
      .send({
        date: futureDate,
        slots: [
          { hour: 12, capacityKwh: 5 }, // price mancante
        ],
      });

    // il service deve rifiutare la richiesta
    expect(res.status).toBe(400);
  });

  afterAll(async () => {
    /* =========================
       CLEANUP
       ========================= */

    // rimozione slot creati dal test
    await ProducerSlot.destroy({
      where: { producerProfileId: producerProfile.id },
    });

    // rimozione profilo producer
    await ProducerProfile.destroy({ where: { id: producerProfile.id } });

    // rimozione utente producer
    await User.destroy({ where: { id: producerUser.id } });
  });
});
