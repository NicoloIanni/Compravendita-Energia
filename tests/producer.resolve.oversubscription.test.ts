import User from "../src/models/User";
import ProducerProfile from "../src/models/ProducerProfile";
import ProducerSlot from "../src/models/ProducerSlot";
import Reservation from "../src/models/Reservation";

import { settlementService } from "../src/container";

describe("Producer resolve with oversubscription (proportional cut + refund)", () => {
  let producerUser: User;
  let producerProfile: ProducerProfile;

  let consumerA: User;
  let consumerB: User;

  let slot: ProducerSlot | null = null;
  let reservationA: Reservation;
  let reservationB: Reservation;

  let creditABefore: number;
  let creditBBefore: number;

  let date: string;
  let hour: number;

  beforeAll(async () => {
    /* =========================
       1️⃣ CREA PRODUCER
    ========================= */
    producerUser = await User.create({
      email: `producer_oversub_${Date.now()}@test.com`,
      passwordHash: "x",
      role: "producer",
      credit: 0,
    } as any);

    producerProfile = await ProducerProfile.create({
      userId: producerUser.id,
      energyType: "Fotovoltaico",
      co2_g_per_kwh: 10,
    } as any);

    /* =========================
       2️⃣ CREA CONSUMER A e B
    ========================= */
    consumerA = await User.create({
      email: `consumerA_${Date.now()}@test.com`,
      passwordHash: "x",
      role: "consumer",
      credit: 100,
    } as any);

    consumerB = await User.create({
      email: `consumerB_${Date.now()}@test.com`,
      passwordHash: "x",
      role: "consumer",
      credit: 100,
    } as any);

    creditABefore = consumerA.credit;
    creditBBefore = consumerB.credit;

    /* =========================
       3️⃣ CREA SLOT DI TEST (UPSERT, SAFE)
       - coerente con seed
       - rispetta UNIQUE
    ========================= */
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    date = tomorrow.toISOString().split("T")[0];
    hour = 12;

    await ProducerSlot.upsert({
      producerProfileId: producerProfile.id,
      date,
      hour,
      capacityKwh: 10,
      pricePerKwh: 1,
    } as any);

    slot = await ProducerSlot.findOne({
      where: {
        producerProfileId: producerProfile.id,
        date,
        hour,
      },
    });

    if (!slot) {
      throw new Error("ProducerSlot upsert failed in test");
    }

    /* =========================
       4️⃣ CREA PRENOTAZIONI PENDING
    ========================= */
    reservationA = await Reservation.create({
      consumerId: consumerA.id,
      producerProfileId: producerProfile.id,
      date,
      hour,
      requestedKwh: 8,
      allocatedKwh: 0,
      status: "PENDING",
      totalCostCharged: 8,
    } as any);

    reservationB = await Reservation.create({
      consumerId: consumerB.id,
      producerProfileId: producerProfile.id,
      date,
      hour,
      requestedKwh: 8,
      allocatedKwh: 0,
      status: "PENDING",
      totalCostCharged: 8,
    } as any);

    /* =========================
       5️⃣ SIMULA ADDEBITO INIZIALE
    ========================= */
    consumerA.credit -= 8;
    consumerB.credit -= 8;
    await consumerA.save();
    await consumerB.save();
  });

  it("should allocate proportionally and refund the difference", async () => {
    /* =========================
       ACT – RESOLVE
    ========================= */
    const result = await settlementService.resolveDay(
      producerProfile.id,
      date
    );

    expect(result.resolvedHours).toBe(1);
    expect(result.oversubscribedHours).toBe(1);

    const updatedA = await Reservation.findByPk(reservationA.id);
    const updatedB = await Reservation.findByPk(reservationB.id);

    expect(updatedA?.status).toBe("ALLOCATED");
    expect(updatedB?.status).toBe("ALLOCATED");

    expect(updatedA?.allocatedKwh).toBeCloseTo(5, 3);
    expect(updatedB?.allocatedKwh).toBeCloseTo(5, 3);

    expect(updatedA?.totalCostCharged).toBeCloseTo(5, 3);
    expect(updatedB?.totalCostCharged).toBeCloseTo(5, 3);

    const finalA = await User.findByPk(consumerA.id);
    const finalB = await User.findByPk(consumerB.id);

    // 100 - 8 + 3 = 95
    expect(finalA!.credit).toBe(creditABefore - 5);
    expect(finalB!.credit).toBe(creditBBefore - 5);
  });

  afterAll(async () => {
    /* =========================
       CLEANUP MIRATO (stesso stile altri test)
    ========================= */
    await Reservation.destroy({
      where: { id: [reservationA.id, reservationB.id] },
    });

    if (slot) {
      await ProducerSlot.destroy({ where: { id: slot.id } });
    }

    await ProducerProfile.destroy({ where: { id: producerProfile.id } });

    await User.destroy({
      where: { id: [producerUser.id, consumerA.id, consumerB.id] },
    });
  });
});
