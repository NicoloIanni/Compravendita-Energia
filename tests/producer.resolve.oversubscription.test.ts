import bcrypt from "bcrypt";
import User from "../src/models/User";
import ProducerProfile from "../src/models/ProducerProfile";
import ProducerSlot from "../src/models/ProducerSlot";
import Reservation from "../src/models/Reservation";

import { settlementService } from "../src/container";

/**
 * TEST DI INTEGRAZIONE
 * Scenario:
 * - uno slot ha capacità inferiore alla somma delle richieste
 * - si applica il taglio proporzionale
 * - viene fatto il refund automatico del credito
 */
describe("Producer resolve with oversubscription (proportional cut + refund)", () => {

  let producerUser: User;
  let producerProfile: ProducerProfile;

  let consumerA: User;
  let consumerB: User;

  let reservationA: Reservation;
  let reservationB: Reservation;

  let creditABefore: number;
  let creditBBefore: number;

  // data molto futura per evitare vincoli temporali
  const date = "2200-01-01";
  const hour = 12;

  beforeAll(async () => {

    // =========================
    // CREA PRODUTTORE
    // =========================
    producerUser = await User.create({
      email: `producer_oversub_${Date.now()}@test.com`,
      passwordHash: await bcrypt.hash("producerX123", 10),
      role: "producer",
      credit: 0,
    } as any);

    producerProfile = await ProducerProfile.create({
      userId: producerUser.id,
      energyType: "Fotovoltaico",
      co2_g_per_kwh: 10,
    } as any);

    // =========================
    // CREA CONSUMATORI
    // =========================
    consumerA = await User.create({
      email: `consumerA_${Date.now()}@test.com`,
      passwordHash: await bcrypt.hash("consumerA123", 10),
      role: "consumer",
      credit: 100,
    } as any);

    consumerB = await User.create({
      email: `consumerB_${Date.now()}@test.com`,
      passwordHash: await bcrypt.hash("consumerB123", 10),
      role: "consumer",
      credit: 100,
    } as any);

    // salvo il credito iniziale (per verificare refund)
    creditABefore = consumerA.credit;
    creditBBefore = consumerB.credit;

    // =========================
    // CREA SLOT (CAPACITÀ LIMITATA)
    // =========================
    await ProducerSlot.create({
      producerProfileId: producerProfile.id,
      date,
      hour,
      capacityKwh: 10, // capacità minore delle richieste totali
      pricePerKwh: 1,
    } as any);

    // =========================
    // CREA PRENOTAZIONI PENDING
    // =========================
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

    // =========================
    // SIMULA ADDEBITO INIZIALE
    // =========================
    consumerA.credit -= 8;
    consumerB.credit -= 8;
    await consumerA.save();
    await consumerB.save();
  });

  /**
   * TEST PRINCIPALE
   * - richieste totali: 16 kWh
   * - capacità slot: 10 kWh
   * - ratio = 10 / 16 = 0.625
   * - allocazione: 8 * 0.625 = 5 kWh ciascuno
   * - refund: 3 kWh * prezzo
   */
  it("should allocate proportionally and refund the difference", async () => {

    const result = await settlementService.resolveDay(
      producerProfile.id,
      date
    );

    // =========================
    // ASSERT RISULTATO RISOLUZIONE
    // =========================
    expect(result.resolvedHours).toBe(1);
    expect(result.oversubscribedHours).toBe(1);

    // =========================
    // ASSERT RESERVATIONS
    // =========================
    const updatedA = await Reservation.findByPk(reservationA.id);
    const updatedB = await Reservation.findByPk(reservationB.id);

    expect(updatedA?.status).toBe("ALLOCATED");
    expect(updatedB?.status).toBe("ALLOCATED");

    expect(updatedA?.allocatedKwh).toBeCloseTo(5, 3);
    expect(updatedB?.allocatedKwh).toBeCloseTo(5, 3);

    expect(updatedA?.totalCostCharged).toBeCloseTo(5, 3);
    expect(updatedB?.totalCostCharged).toBeCloseTo(5, 3);

    // =========================
    // ASSERT REFUND CREDITI
    // =========================
    const finalA = await User.findByPk(consumerA.id);
    const finalB = await User.findByPk(consumerB.id);

    expect(finalA!.credit).toBe(creditABefore - 5);
    expect(finalB!.credit).toBe(creditBBefore - 5);
  });

  afterAll(async () => {
    // =========================
    // CLEANUP
    // =========================
    await Reservation.destroy({
      where: { id: [reservationA?.id, reservationB?.id].filter(Boolean) },
    });

    await ProducerSlot.destroy({
      where: {
        producerProfileId: producerProfile.id,
        date,
        hour,
      },
    });

    await ProducerProfile.destroy({
      where: { id: producerProfile.id },
    });

    await User.destroy({
      where: {
        id: [
          producerUser.id,
          consumerA.id,
          consumerB.id,
        ].filter(Boolean),
      },
    });
  });
});
