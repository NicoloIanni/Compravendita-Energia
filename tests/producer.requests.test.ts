import request from "supertest";
import app from "../src/app";
import User from "../src/models/User";
import ProducerProfile from "../src/models/ProducerProfile";
import ProducerSlot from "../src/models/ProducerSlot";
import Reservation from "../src/models/Reservation";
import jwt from "jsonwebtoken";

/**
 * TEST DI INTEGRAZIONE
 * Endpoint: GET /producers/me/requests
 *
 * Obiettivo:
 * - verificare che il producer veda correttamente
 *   le richieste aggregate per slot
 * - in particolare:
 *   - capacity
 *   - somma kWh richiesti
 *   - percentuale di occupazione
 */
describe("GET /producers/me/requests", () => {
  let producerToken: string;
  let producerProfileId: number;

  // data fissa per rendere il test deterministico
  const testDate = "2026-01-21";

  beforeAll(async () => {

    // =========================
    // CREA PRODUCER
    // =========================
    const producer = await User.create({
      email: `producer@test.it`,
      passwordHash: "fake",
      role: "producer",
    } as any);

    // =========================
    // CREA CONSUMER
    // =========================
    const consumer = await User.create({
      email: `consumer@test.it`,
      passwordHash: "fake",
      role: "consumer",
      credit: 1000,
    } as any);

    // =========================
    // CREA PRODUCER PROFILE
    // =========================
    const profile = await ProducerProfile.create({
      userId: producer.id,
      energyType: "Fotovoltaico",
      co2_g_per_kwh: 10,
    } as any);

    producerProfileId = profile.id;

    // =========================
    // CREA SLOT
    // =========================
    await ProducerSlot.create({
      producerProfileId,
      date: testDate,
      hour: 10,
      capacityKwh: 50,
      pricePerKwh: 1,
    } as any);

    // =========================
    // CREA RESERVATION
    // =========================
    // Reservation già ALLOCATED per simulare
    // una situazione post-resolve
    await Reservation.create({
      consumerId: consumer.id,
      producerProfileId,
      date: testDate,
      hour: 10,
      requestedKwh: 20,
      allocatedKwh: 20,
      status: "ALLOCATED",
      totalCostCharged: 20,
    } as any);

    // =========================
    // CREA JWT PRODUCER
    // =========================
    producerToken = jwt.sign(
      {
        userId: producer.id,
        role: "producer",
        profileId: producerProfileId,
      },
      process.env.JWT_SECRET || "testsecret"
    );
  });

  /**
   * TEST PRINCIPALE
   * - capacity = 50
   * - requested = 20
   * - occupancy = 20 / 50 = 40%
   */
  it("returns occupancy percentage for producer slots", async () => {

    // =========================
    // DEBUG (facoltativo)
    // =========================
    // serve solo per ispezione DB durante il test
    const allSlots = await ProducerSlot.findAll({
      where: { producerProfileId },
    });

    const allReservations = await Reservation.findAll({
      where: { producerProfileId, date: testDate },
    });

    // =========================
    // CHIAMATA API
    // =========================
    const res = await request(app)
      .get("/producers/me/requests")
      .query({ date: testDate })
      .set("Authorization", `Bearer ${producerToken}`);

    // =========================
    // ASSERT
    // =========================
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);

    expect(res.body[0]).toMatchObject({
      hour: 10,
      capacityKwh: 50,
      sumRequestedKwh: 20,
      occupancyPercent: 40,
    });
  });
});
