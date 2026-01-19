/**
 * Unit test ReservationService (senza DB reale)
 * - Mocka sequelize.transaction
 * - Mocka repositories
 * - Controlla tempo con jest.setSystemTime (regola 24h)
 */

jest.mock("../../src/db", () => {
  return {
    sequelize: {
      transaction: async (fn: any) => {
        // tx fake: basta per far contento chi usa tx.LOCK.UPDATE
        const tx = { LOCK: { UPDATE: "UPDATE" } };
        return fn(tx);
      },
    },
  };
});

import { ReservationService } from "../../src/services/ReservationService";

describe("ReservationService", () => {
  let userRepository: any;
  let producerSlotRepository: any;
  let reservationRepository: any;
  let service: ReservationService;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    };

    producerSlotRepository = {
      findByProducerDateHour: jest.fn(),
    };

    reservationRepository = {
      create: jest.fn(),
      findByIdForUpdate: jest.fn(),
      save: jest.fn(),
    };

    service = new ReservationService(
      userRepository,
      producerSlotRepository,
      reservationRepository
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  // ======================================================
  // CREATE RESERVATION
  // ======================================================

  it("createReservation: rifiuta requestedKwh < 0.1", async () => {
    await expect(
      service.createReservation({
        consumerId: 1,
        producerProfileId: 1,
        date: "2026-01-21",
        hour: 10,
        requestedKwh: 0.05,
      })
    ).rejects.toMatchObject({
      name: "DomainError",
      message: "INVALID_KWH",
    });
  });

  it("createReservation: rifiuta se slot non prenotabile (<= 24h)", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-20T10:00:00Z"));

    await expect(
      service.createReservation({
        consumerId: 1,
        producerProfileId: 1,
        date: "2026-01-21",
        hour: 9, // 23h dopo -> NON prenotabile
        requestedKwh: 1,
      })
    ).rejects.toMatchObject({
      name: "DomainError",
      message: "SLOT_NOT_BOOKABLE_24H",
    });
  });

  it("createReservation: scala credito e crea PENDING", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-20T10:00:00Z"));

    const consumer = { id: 1, credit: 100 };
    const slot = { pricePerKwh: 10 };

    userRepository.findById.mockResolvedValue(consumer);
    producerSlotRepository.findByProducerDateHour.mockResolvedValue(slot);

    const createdReservation = {
      id: 99,
      consumerId: 1,
      producerProfileId: 1,
      date: "2026-01-21",
      hour: 12,
      requestedKwh: 2,
      allocatedKwh: 0,
      status: "PENDING",
      totalCostCharged: 20,
    };

    reservationRepository.create.mockResolvedValue(createdReservation);

    const res = await service.createReservation({
      consumerId: 1,
      producerProfileId: 1,
      date: "2026-01-21",
      hour: 12, // 26h dopo -> OK
      requestedKwh: 2,
    });

    expect(res).toBe(createdReservation);
    expect(consumer.credit).toBe(80);
    expect(userRepository.save).toHaveBeenCalledWith(
      consumer,
      expect.anything()
    );
    expect(reservationRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "PENDING",
        totalCostCharged: 20,
      }),
      expect.anything()
    );
  });

  // ======================================================
  // UPDATE / CANCEL RESERVATION
  // ======================================================

  it("updateReservation: entro 24h consente SOLO cancellazione senza refund", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-20T11:30:00Z"));

    const reservation: any = {
      id: 1,
      consumerId: 1,
      producerProfileId: 10,
      date: "2026-01-20",
      hour: 12, // tra 30 min
      requestedKwh: 5,
      totalCostCharged: 50,
      status: "PENDING",
    };

    const consumer = { id: 1, credit: 20 };
    const slot = { pricePerKwh: 10 };

    reservationRepository.findByIdForUpdate.mockResolvedValue(reservation);
    userRepository.findById.mockResolvedValue(consumer);
    producerSlotRepository.findByProducerDateHour.mockResolvedValue(slot);
    reservationRepository.save.mockImplementation(async (r: any) => r);

    const res = await service.updateReservation({
      consumerId: 1,
      reservationId: 1,
      requestedKwh: 0,
    });

    expect(res.status).toBe("CANCELLED");
    expect(res.requestedKwh).toBe(0);
    expect(consumer.credit).toBe(20); // NO refund
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it("updateReservation: entro 24h rifiuta modifiche (requestedKwh > 0)", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-20T11:30:00Z"));

    const reservation: any = {
      id: 1,
      consumerId: 1,
      producerProfileId: 10,
      date: "2026-01-20",
      hour: 12,
      requestedKwh: 5,
      totalCostCharged: 50,
      status: "PENDING",
    };

    reservationRepository.findByIdForUpdate.mockResolvedValue(reservation);
    userRepository.findById.mockResolvedValue({ id: 1, credit: 999 });
    producerSlotRepository.findByProducerDateHour.mockResolvedValue({
      pricePerKwh: 10,
    });

    await expect(
      service.updateReservation({
        consumerId: 1,
        reservationId: 1,
        requestedKwh: 4,
      })
    ).rejects.toMatchObject({
      name: "DomainError",
      message: "MODIFICATION_NOT_ALLOWED_24H",
    });
  });

  it("updateReservation: oltre 24h cancellazione rimborsa", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-20T10:00:00Z"));

    const reservation: any = {
      id: 1,
      consumerId: 1,
      producerProfileId: 10,
      date: "2026-01-21",
      hour: 12, // 26h dopo
      requestedKwh: 5,
      totalCostCharged: 50,
      status: "PENDING",
    };

    const consumer = { id: 1, credit: 20 };
    const slot = { pricePerKwh: 10 };

    reservationRepository.findByIdForUpdate.mockResolvedValue(reservation);
    userRepository.findById.mockResolvedValue(consumer);
    producerSlotRepository.findByProducerDateHour.mockResolvedValue(slot);
    reservationRepository.save.mockImplementation(async (r: any) => r);

    const res = await service.updateReservation({
      consumerId: 1,
      reservationId: 1,
      requestedKwh: 0,
    });

    expect(res.status).toBe("CANCELLED");
    expect(consumer.credit).toBe(70); // refund 50
    expect(userRepository.save).toHaveBeenCalledWith(
      consumer,
      expect.anything()
    );
  });
});
