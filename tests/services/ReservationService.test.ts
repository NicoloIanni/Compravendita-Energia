/**
 * Unit test ReservationService
 * - mock sequelize.transaction
 * - mock repositories (including sumAllocatedForSlot)
 * - mock Reservation.sum static
 */

jest.mock("../../src/db", () => ({
  sequelize: {
    transaction: async (fn: any) => {
      const tx = { LOCK: { UPDATE: "UPDATE" } };
      return fn(tx);
    },
  },
}));

import * as ReservationModel from "../../src/models/Reservation";
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
      findOne: jest.fn(),
      sum: jest.fn(),
      findPendingByConsumerSlot: jest.fn(),
      sumAllocatedForSlot: jest.fn(),
    };

    jest
      .spyOn(ReservationModel.default, "sum")
      .mockResolvedValue(0);

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

  it("createReservation: scala credito e crea PENDING", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-20T10:00:00Z"));

    const consumer = { id: 1, credit: 100 };
    const slot = { pricePerKwh: 10, capacityKwh: 8 };

    userRepository.findById.mockResolvedValue(consumer);
    producerSlotRepository.findByProducerDateHour.mockResolvedValue(slot);

    reservationRepository.sumAllocatedForSlot.mockResolvedValue(0);
    reservationRepository.findPendingByConsumerSlot.mockResolvedValue(null);
    reservationRepository.findOne.mockResolvedValue(null);

    reservationRepository.create.mockResolvedValue({
      id: 123,
      status: "PENDING",
    });

    const result = await service.createReservation({
      consumerId: 1,
      producerProfileId: 1,
      date: "2026-01-21",
      hour: 12,
      requestedKwh: 2,
    });

    expect(result.status).toBe("PENDING");
    expect(consumer.credit).toBe(80);
    expect(userRepository.save).toHaveBeenCalledWith(
      consumer,
      expect.anything()
    );
    expect(reservationRepository.create).toHaveBeenCalled();
  });

  it("createReservation: blocca se slot pieno", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-20T10:00:00Z"));

    userRepository.findById.mockResolvedValue({ id: 1, credit: 100 });
    producerSlotRepository.findByProducerDateHour.mockResolvedValue({
      pricePerKwh: 10,
      capacityKwh: 8,
    });

    reservationRepository.sumAllocatedForSlot.mockResolvedValue(8);
    reservationRepository.findPendingByConsumerSlot.mockResolvedValue(null);
    reservationRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createReservation({
        consumerId: 1,
        producerProfileId: 2,
        date: "2026-01-21",
        hour: 15,
        requestedKwh: 1,
      })
    ).rejects.toMatchObject({
      message: "SLOT_FULL_CANNOT_BOOK",
    });
  });

  it("createReservation: blocca conflitto stessa ora con altro producer", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-20T10:00:00Z"));

    userRepository.findById.mockResolvedValue({ id: 1, credit: 100 });
    producerSlotRepository.findByProducerDateHour.mockResolvedValue({
      pricePerKwh: 5,
      capacityKwh: 8,
    });

    reservationRepository.sumAllocatedForSlot.mockResolvedValue(0);
    reservationRepository.findPendingByConsumerSlot.mockResolvedValue(null);

    reservationRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 987 });

    await expect(
      service.createReservation({
        consumerId: 1,
        producerProfileId: 3,
        date: "2026-01-21",
        hour: 15,
        requestedKwh: 1,
      })
    ).rejects.toMatchObject({
      message: "ALREADY_BOOKED_SAME_HOUR",
    });
  });

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
      message: "INVALID_KWH",
    });
  });

  it("createReservation: rifiuta se slot non prenotabile entro 24h", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-20T10:00:00Z"));

    await expect(
      service.createReservation({
        consumerId: 1,
        producerProfileId: 1,
        date: "2026-01-21",
        hour: 9,
        requestedKwh: 1,
      })
    ).rejects.toMatchObject({
      message: "SLOT_NOT_BOOKABLE_24H",
    });
  });

  // ======================================================
  // UPDATE / CANCEL RESERVATION
  // ======================================================

  it("updateReservation: entro 24h consente cancellazione", async () => {
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

    userRepository.findById.mockResolvedValue({ id: 1, credit: 20 });
    producerSlotRepository.findByProducerDateHour.mockResolvedValue({
      pricePerKwh: 10,
    });

    reservationRepository.findByIdForUpdate.mockResolvedValue(reservation);
    reservationRepository.save.mockImplementation(async (r: any) => r);

    const res = await service.updateReservation({
      consumerId: 1,
      reservationId: 1,
      requestedKwh: 0,
    });

    expect(res.status).toBe("CANCELLED");
  });
});
