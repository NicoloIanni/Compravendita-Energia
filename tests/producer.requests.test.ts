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

    const producer = await User.create({
      email: `producer@test.it`,
      passwordHash: "fake",
      role: "producer",
    } as any);

    const consumer = await User.create({
      email: `consumer@test.it`,
      passwordHash: "fake",
      role: "consumer",
      credit: 1000,
    } as any);

    const profile = await ProducerProfile.create({
      userId: producer.id,
      energyType: "Fotovoltaico",
      co2_g_per_kwh: 10,
    } as any);
    producerProfileId = profile.id;
  

  
    const slot = await ProducerSlot.create({
      producerProfileId,
      date: testDate,
      hour: 10,
      capacityKwh: 50,
      pricePerKwh: 1,
    } as any);

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
   

 
    producerToken = jwt.sign(
      {
        userId: producer.id,
        role: "producer",
        profileId: producerProfileId,
      },
      process.env.JWT_SECRET || "testsecret"
    );


  });

  it("returns occupancy percentage for producer slots", async () => {


    // Debug: show what's in DB before request
    const allSlots = await ProducerSlot.findAll({
      where: { producerProfileId },
    });

    const allReservations = await Reservation.findAll({
      where: { producerProfileId, date: testDate },
    });


    const res = await request(app)
      .get("/producers/me/requests")
      .query({ date: testDate })
      .set("Authorization", `Bearer ${producerToken}`);

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
