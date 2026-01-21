import request from "supertest";
import app from "../src/app";
import User from "../src/models/User";
import ProducerProfile from "../src/models/ProducerProfile";
import ProducerSlot from "../src/models/ProducerSlot";
import Reservation from "../src/models/Reservation";
import jwt from "jsonwebtoken";

describe("GET /producers/me/requests", () => {
  let producerToken: string;
  let producerProfileId: number;
  const testDate = "2026-01-21";

  beforeAll(async () => {
    console.log("🔍 [SETUP] Creating producer");
    const producer = await User.create({
      email: `producer@test.it`,
      passwordHash: "fake",
      role: "producer",
    } as any);
    console.log("🔍 [SETUP] producer:", producer && producer.id);

    console.log("🔍 [SETUP] Creating consumer");
    const consumer = await User.create({
      email: `consumer@test.it`,
      passwordHash: "fake",
      role: "consumer",
      credit: 1000,
    } as any);
    console.log("🔍 [SETUP] consumer:", consumer && consumer.id);

    console.log("🔍 [SETUP] Creating producerProfile");
    const profile = await ProducerProfile.create({
      userId: producer.id,
      energyType: "Fotovoltaico",
      co2_g_per_kwh: 10,
    } as any);
    producerProfileId = profile.id;
    console.log("🔍 [SETUP] producerProfileId:", producerProfileId);

    console.log("🔍 [SETUP] Creating ProducerSlot");
    const slot = await ProducerSlot.create({
      producerProfileId,
      date: testDate,
      hour: 10,
      capacityKwh: 50,
      pricePerKwh: 1,
    } as any);
    console.log("🔍 [SETUP] slot created:", slot && slot.id);

    console.log("🔍 [SETUP] Creating Reservation");
    const reservation = await Reservation.create({
      consumerId: consumer.id,
      producerProfileId,
      date: testDate,
      hour: 10,
      requestedKwh: 20,
      allocatedKwh: 20,
      status: "ALLOCATED",
      totalCostCharged: 20,
    } as any);
    console.log("🔍 [SETUP] reservation created:", reservation && reservation.id);

    console.log("🔍 [SETUP] JWT signing");
    producerToken = jwt.sign(
      {
        userId: producer.id,
        role: "producer",
        profileId: producerProfileId,
      },
      process.env.JWT_SECRET || "testsecret"
    );

    console.log("🔍 [SETUP] Finished beforeAll");
  });

  it("returns occupancy percentage for producer slots", async () => {
    console.log("➡️ [TEST] Fetching /producers/me/requests for date:", testDate);

    // Debug: show what's in DB before request
    const allSlots = await ProducerSlot.findAll({
      where: { producerProfileId },
    });
    console.log("📊 [DEBUG] slots in DB:", allSlots.map(s => ({
      id: s.id,
      date: s.date,
      hour: s.hour,
      capacityKwh: s.capacityKwh,
    })));

    const allReservations = await Reservation.findAll({
      where: { producerProfileId, date: testDate },
    });
    console.log("📊 [DEBUG] reservations in DB:", allReservations.map(r => ({
      id: r.id,
      requestedKwh: r.requestedKwh,
      allocatedKwh: r.allocatedKwh,
      status: r.status,
    })));

    const res = await request(app)
      .get("/producers/me/requests")
      .query({ date: testDate })
      .set("Authorization", `Bearer ${producerToken}`);

    console.log("➡️ [TEST] API Response status:", res.status);
    console.log("➡️ [TEST] API Response body:", res.body);

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
