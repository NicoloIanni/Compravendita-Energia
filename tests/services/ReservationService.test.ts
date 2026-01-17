import { ReservationService, DomainError } from "../../src/services/ReservationService";
import { UserRepository } from "../../src/repositories/UserRepository";
import { ProducerSlotRepository } from "../../src/repositories/ProducerSlotRepository";
import { ReservationRepository } from "../../src/repositories/ReservationRepository";

describe("ReservationService", () => {
  let userRepository: jest.Mocked<UserRepository>;
  let producerSlotRepository: jest.Mocked<ProducerSlotRepository>;
  let reservationRepository: jest.Mocked<ReservationRepository>;
  let service: ReservationService;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    } as any;

    producerSlotRepository = {
      findByProducerDateHour: jest.fn(),
    } as any;

    reservationRepository = {
      create: jest.fn(),
    } as any;

    service = new ReservationService(
      userRepository,
      producerSlotRepository,
      reservationRepository
    );
  });

  it("creates a PENDING reservation and scales credit", async () => {
    const consumer = {
      id: 1,
      credit: 100,
    };

    const slot = {
      pricePerKwh: 10,
    };

    const reservationMock = {
      id: 1,
      status: "PENDING",
    };

    userRepository.findById.mockResolvedValue(consumer as any);
    producerSlotRepository.findByProducerDateHour.mockResolvedValue(slot as any);
    reservationRepository.create.mockResolvedValue(reservationMock as any);
    userRepository.save.mockResolvedValue();

    const result = await service.createReservation({
      consumerId: 1,
      producerProfileId: 1,
      date: "2099-01-01",
      hour: 10,
      requestedKwh: 2,
    });

    expect(result).toBe(reservationMock);
    expect(reservationRepository.create).toHaveBeenCalled();
    expect(consumer.credit).toBe(80); // 100 - (2 * 10)
  });

  it("throws error if credit is insufficient", async () => {
    const consumer = {
      id: 1,
      credit: 5,
    };

    const slot = {
      pricePerKwh: 10,
    };

    userRepository.findById.mockResolvedValue(consumer as any);
    producerSlotRepository.findByProducerDateHour.mockResolvedValue(slot as any);

    await expect(
      service.createReservation({
        consumerId: 1,
        producerProfileId: 1,
        date: "2099-01-01",
        hour: 10,
        requestedKwh: 1,
      })
    ).rejects.toThrow(DomainError);

    expect(reservationRepository.create).not.toHaveBeenCalled();
    expect(consumer.credit).toBe(5);
  });
});
