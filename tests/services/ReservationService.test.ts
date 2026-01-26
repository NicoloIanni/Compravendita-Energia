/**
 * Unit test ReservationService
 *
 * Obiettivo:
 * - testare solo la logica di business del ReservationService
 * - nessun accesso a DB reale
 * - tutto ciò che è esterno (DB, repository) viene mockato
 */

// ======================================================
// MOCK DEL MODULO DB
// ======================================================
// Intercettiamo sequelize.transaction per evitare:
// - connessione reale al DB
// - gestione reale delle transazioni
// Il service riceverà comunque un "tx" finto
jest.mock("../../src/db", () => ({
  sequelize: {
    transaction: async (fn: any) => {
      // transazione finta con struttura minima
      const tx = { LOCK: { UPDATE: "UPDATE" } };
      return fn(tx);
    },
  },
}));

import { ReservationService } from "../../src/services/ReservationService";

describe("ReservationService", () => {
  // Repository mockati (dipendenze del service)
  let userRepository: any;
  let producerSlotRepository: any;
  let reservationRepository: any;

  // Service reale (quello che stiamo testando)
  let service: ReservationService;

  // ======================================================
  // SETUP PRIMA DI OGNI TEST
  // ======================================================
  beforeEach(() => {
    /**
     * Mock UserRepository
     * Serve per:
     * - recuperare consumer
     * - aggiornare il credito
     */
    userRepository = {
      findById: jest.fn(),
      findByIdForUpdate: jest.fn(),
      save: jest.fn(),
    };

    /**
     * Mock ProducerSlotRepository
     * Serve per:
     * - recuperare slot (prezzo, capacità, deleted)
     */
    producerSlotRepository = {
      findByProducerDateHour: jest.fn(),
    };

    /**
     * Mock ReservationRepository
     * Serve per:
     * - creare reservation
     * - cercare conflitti
     * - recuperare reservation con lock
     */
    reservationRepository = {
      create: jest.fn(),
      findByIdForUpdate: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findPendingByConsumerSlot: jest.fn(),
      sumAllocatedForSlot: jest.fn(),
    };

    // Istanza reale del service con repository mockati
    service = new ReservationService(
      userRepository,
      producerSlotRepository,
      reservationRepository
    );
  });

  // Pulizia dopo ogni test
  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  // ======================================================
  // CREATE RESERVATION
  // ======================================================

  it("createReservation: scala credito e crea PENDING", async () => {
    /**
     * Simuliamo il tempo:
     * necessario per testare correttamente la regola delle 24h
     */
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-20T10:00:00Z"));

    // Consumer finto con credito iniziale
    const consumer = { id: 1, credit: 100 };

    // Slot finto con prezzo e capacità
    const slot = { pricePerKwh: 10, capacityKwh: 8 };

    // Mock dei repository
    userRepository.findById.mockResolvedValue(consumer);
    producerSlotRepository.findByProducerDateHour.mockResolvedValue(slot);

    // Nessun conflitto
    reservationRepository.findOne.mockResolvedValue(null);
    reservationRepository.findPendingByConsumerSlot.mockResolvedValue(null);

    // Creazione reservation simulata
    reservationRepository.create.mockResolvedValue({
      id: 123,
      status: "PENDING",
    });

    // Chiamata reale al service
    const result = await service.createReservation({
      consumerId: 1,
      producerProfileId: 1,
      date: "2026-01-21",
      hour: 12,
      requestedKwh: 2,
    });

    // Verifica stato
    expect(result.status).toBe("PENDING");

    // Verifica credito scalato: 2 kWh * 10 = 20
    expect(consumer.credit).toBe(80);

    // Verifica che il consumer sia stato salvato
    expect(userRepository.save).toHaveBeenCalledWith(
      consumer,
      expect.anything()
    );

    // Verifica che la reservation sia stata creata
    expect(reservationRepository.create).toHaveBeenCalled();
  });

  it("createReservation: blocca conflitto stessa ora con altro producer", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-01-20T10:00:00Z"));

    userRepository.findById.mockResolvedValue({ id: 1, credit: 100 });
    producerSlotRepository.findByProducerDateHour.mockResolvedValue({
      pricePerKwh: 5,
      capacityKwh: 8,
    });

    /**
     * Simulazione conflitto:
     * esiste già una reservation dello stesso consumer
     * nella stessa data/ora ma con produttore diverso
     */
    reservationRepository.findOne.mockResolvedValue({ id: 999 });

    // Deve lanciare DomainError
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
    /**
     * Validazione puramente di dominio:
     * non serve alcun mock
     */
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

    /**
     * Slot alle 09 del giorno dopo → meno di 24h
     */
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

    // Reservation PENDING entro 24h
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

    // Mock repository
    reservationRepository.findByIdForUpdate.mockResolvedValue(reservation);
    producerSlotRepository.findByProducerDateHour.mockResolvedValue({
      pricePerKwh: 10,
    });
    userRepository.findByIdForUpdate.mockResolvedValue({
      id: 1,
      credit: 20,
    });

    reservationRepository.save.mockImplementation(async (r: any) => r);

    // requestedKwh = 0 → cancellazione
    const res = await service.updateReservation({
      consumerId: 1,
      reservationId: 1,
      requestedKwh: 0,
    });

    // Verifica stato finale
    expect(res.status).toBe("CANCELLED");
  });
});
