import type { Transaction } from "sequelize";
import { ProducerProfileRepository } from "../repositories/ProducerProfileRepository";
import { ProducerSlotRepository } from "../repositories/ProducerSlotRepository";

/**
 * Input per la creazione/upsert di uno slot
 * Ogni slot rappresenta una singola ora di produzione
 */
interface SlotInput {
  hour: number;
  capacityKwh: number;
  pricePerKwh: number;
}

/**
 * Input per l’aggiornamento di uno slot esistente
 * capacityKwh e pricePerKwh sono opzionali
 */
interface UpdateSlotInput {
  date: string;
  hour: number;
  capacityKwh?: number;
  pricePerKwh?: number;
}

/**
 * Service usato per esporre ai consumer la lista
 * dei produttori con i relativi slot disponibili
 */
export class ProducerService {
  constructor(
    // Repository dei profili produttori
    private producerRepository: ProducerProfileRepository,

    // Repository degli slot di produzione
    private producerSlotRepository: ProducerSlotRepository
  ) {}

  /**
   * Restituisce tutti i produttori con i loro slot.
   * Se viene passata una data, filtra gli slot solo per quel giorno.
   */
  async getAllWithSlots(date?: string) {
    // Recupera tutti i producerProfile (con join su User)
    const producers = await this.producerRepository.findAllProducers();

    // Per ogni producer carichiamo i relativi slot
    const result = await Promise.all(
      producers.map(async (p: any) => {
        let slots = [];

        // Se è specificata una data → solo slot di quel giorno
        if (date) {
          slots = await this.producerSlotRepository.findByProducerAndDate(
            p.id,
            date,
            0,
            23
          );
        } 
        // Altrimenti → tutti gli slot nel range temporale
        else {
          slots = await this.producerSlotRepository.findByProducerAndRange({
            producerProfileId: p.id,
          });
        }

        // Mapping dell’output esposto al consumer
        return {
          producerProfileId: p.id,
          energyType: p.energyType,
          co2_g_per_kwh: p.co2_g_per_kwh,

          // Slot semplificati (solo dati rilevanti)
          slots: slots.map((s: any) => ({
            date: s.date,
            hour: s.hour,
            capacityKwh: s.capacityKwh,
            pricePerKwh: s.pricePerKwh,
          })),
        };
      })
    );

    return result;
  }
}

/**
 * Service che gestisce la scrittura degli slot
 * (creazione, upsert, aggiornamento)
 */
export class ProducerSlotService {
  // Repository degli slot (iniettato)
  private repo: any;

  constructor({ producerSlotRepository }: { producerSlotRepository: any }) {
    this.repo = producerSlotRepository;
  }

  // =========================
  // VALIDAZIONE SLOT
  // =========================
  /**
   * Valida i dati di uno slot prima della persistenza
   */
  private validateSlot(slot: SlotInput) {
    const errors: string[] = [];

    // Ora valida (0–23)
    if (slot.hour == null || slot.hour < 0 || slot.hour > 23) {
      errors.push("hour deve essere tra 0 e 23");
    }

    // Capacità deve essere positiva
    if (slot.capacityKwh == null || slot.capacityKwh <= 0) {
      errors.push("capacityKwh deve essere > 0");
    }

    // Prezzo non negativo
    if (slot.pricePerKwh == null || slot.pricePerKwh < 0) {
      errors.push("pricePerKwh deve essere >= 0");
    }

    // Se ci sono errori → HTTP 400
    if (errors.length) {
      const err = new Error(errors.join("; "));
      (err as any).status = 400;
      throw err;
    }
  }

  // =========================
  // UPSERT SLOT (BATCH)
  // =========================
  /**
   * Inserisce o aggiorna in blocco gli slot di un produttore
   * usando la chiave unica (producerProfileId, date, hour)
   */
  async upsertSlots(
    producerProfileId: number,
    date: string,
    slots: SlotInput[],
    options?: { transaction?: Transaction }
  ) {
    // Validazione data
    if (!date) {
      const err = new Error("date mancante");
      (err as any).status = 400;
      throw err;
    }

    // Validazione array slot
    if (!Array.isArray(slots) || slots.length === 0) {
      const err = new Error("slots deve essere un array non vuoto");
      (err as any).status = 400;
      throw err;
    }

    // Costruzione payload da upsertare
    const toUpsert = slots.map((slot) => {
      // Validazione singolo slot
      this.validateSlot(slot);

      return {
        producerProfileId,
        date,
        hour: slot.hour,
        capacityKwh: slot.capacityKwh,
        pricePerKwh: slot.pricePerKwh,
      };
    });

    // Bulk upsert con updateOnDuplicate
    return this.repo.upsertBatch(
      toUpsert,
      options?.transaction
    );
  }

  // =========================
  // UPDATE SLOT (BATCH)
  // =========================
  /**
   * Aggiorna slot esistenti uno per uno.
   * Se uno slot non esiste → viene ignorato.
   */
  async updateSlots(
    producerProfileId: number,
    updates: UpdateSlotInput[],
    options?: { transaction?: Transaction }
  ) {
    // Validazione input
    if (!Array.isArray(updates) || updates.length === 0) {
      const err = new Error("updates deve essere un array non vuoto");
      (err as any).status = 400;
      throw err;
    }

    const results: any[] = [];

    for (const item of updates) {
      const { date, hour, capacityKwh, pricePerKwh } = item;

      // Ogni update deve avere date e hour
      if (!date || typeof hour !== "number") {
        const err = new Error("Ogni update deve includere date e hour");
        (err as any).status = 400;
        throw err;
      }

      // Validazione valori opzionali
      if (capacityKwh !== undefined && capacityKwh <= 0) {
        const err = new Error("capacityKwh deve essere > 0");
        (err as any).status = 400;
        throw err;
      }

      if (pricePerKwh !== undefined && pricePerKwh < 0) {
        const err = new Error("pricePerKwh deve essere >= 0");
        (err as any).status = 400;
        throw err;
      }

      // Payload di update dinamico
      const payload: any = {};
      if (capacityKwh !== undefined) payload.capacityKwh = capacityKwh;
      if (pricePerKwh !== undefined) payload.pricePerKwh = pricePerKwh;

      // Se non c’è nulla da aggiornare → skip
      if (Object.keys(payload).length === 0) {
        continue;
      }

      // Verifica esistenza slot
      const existing = await this.repo.findByProducerDateHour(
        producerProfileId,
        date,
        hour,
        options?.transaction
      );

      if (!existing) {
        // Slot inesistente → nessun errore, semplicemente skip
        continue;
      }

      // Update dello slot esistente
      const updatedItem = await this.repo.model.update(payload, {
        where: {
          producerProfileId,
          date,
          hour,
        },
        returning: true,
        transaction: options?.transaction,
      });

      // Sequelize restituisce [count, rows]
      if (Array.isArray(updatedItem) && updatedItem[0] > 0) {
        const updatedSlot = (updatedItem as any)[1][0];
        results.push(updatedSlot);
      }
    }

    return results;
  }
}
