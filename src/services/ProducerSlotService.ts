

import type { Transaction } from "sequelize";
import { ProducerProfileRepository } from "../repositories/ProducerProfileRepository";
import { ProducerSlotRepository } from "../repositories/ProducerSlotRepository";


interface SlotInput {
  hour: number;
  capacityKwh: number;
  pricePerKwh: number;
}

interface UpdateSlotInput {
  date: string;
  hour: number;
  capacityKwh?: number;
  pricePerKwh?: number;
}

export class ProducerService {
  constructor(
    private producerRepository: ProducerProfileRepository,
    private producerSlotRepository: ProducerSlotRepository
  ) {}

async getAllWithSlots(date?: string) {
    const producers = await this.producerRepository.findAllProducers();

    const result = await Promise.all(
      producers.map(async (p: any) => {
        let slots = [];

        if (date) {
          slots = await this.producerSlotRepository.findByProducerAndDate(
            p.id,
            date,
            0,
            23
          );
        } else {
          slots = await this.producerSlotRepository.findByProducerAndRange({
            producerProfileId: p.id,
          });
        }
        return {
          producerProfileId: p.id,                  
          energyType: p.energyType,
          co2_g_per_kwh: p.co2_g_per_kwh,
          
          
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

export class ProducerSlotService {
  private repo: any;

  constructor({ producerSlotRepository }: { producerSlotRepository: any }) {
    this.repo = producerSlotRepository;
  }


  // =========================
  // VALIDATION
  // =========================
  private validateSlot(slot: SlotInput) {
    const errors: string[] = [];

    if (slot.hour == null || slot.hour < 0 || slot.hour > 23) {
      errors.push("hour deve essere tra 0 e 23");
    }

    if (slot.capacityKwh == null || slot.capacityKwh <= 0) {
      errors.push("capacityKwh deve essere > 0");
    }

    if (slot.pricePerKwh == null || slot.pricePerKwh < 0) {
      errors.push("pricePerKwh deve essere >= 0");
    }

    if (errors.length) {
      const err = new Error(errors.join("; "));
      (err as any).status = 400;
      throw err;
    }
  }

  // =========================
  // UPSERT UNICO
  // =========================
  async upsertSlots(
    producerProfileId: number,
    date: string,
    slots: SlotInput[],
    options?: { transaction?: Transaction }
  ) {
    if (!date) {
      const err = new Error("date mancante");
      (err as any).status = 400;
      throw err;
    }

    if (!Array.isArray(slots) || slots.length === 0) {
      const err = new Error("slots deve essere un array non vuoto");
      (err as any).status = 400;
      throw err;
    }

    const toUpsert = slots.map((slot) => {
      this.validateSlot(slot);

      return {
        producerProfileId,
        date,
        hour: slot.hour,
        capacityKwh: slot.capacityKwh,
        pricePerKwh: slot.pricePerKwh,
      };
    });

    return this.repo.upsertBatch(
      toUpsert,
      options?.transaction
    );
  }
  // =========================
  // UPDATE BATCH
  // =========================
 async updateSlots(
    producerProfileId: number,
    updates: UpdateSlotInput[],
    options?: { transaction?: Transaction }
  ) {
    if (!Array.isArray(updates) || updates.length === 0) {
      const err = new Error("updates deve essere un array non vuoto");
      (err as any).status = 400;
      throw err;
    }

    const results: any[] = [];

    for (const item of updates) {
      const { date, hour, capacityKwh, pricePerKwh } = item;

      // controllo campi base
      if (!date || typeof hour !== "number") {
        const err = new Error("Ogni update deve includere date e hour");
        (err as any).status = 400;
        throw err;
      }

      // Validazione valori (ma solo se presenti)
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

      // costruiamo payload di aggiornamento
      const payload: any = {};
      if (capacityKwh !== undefined) payload.capacityKwh = capacityKwh;
      if (pricePerKwh !== undefined) payload.pricePerKwh = pricePerKwh;

      // se non c’è nulla da aggiornare skip
      if (Object.keys(payload).length === 0) {
        continue;
      }

      // PRIMA CERCO SE LO SLOT ESISTE
      const existing = await this.repo.findByProducerDateHour(
        producerProfileId,
        date,
        hour,
        options?.transaction
      );

      if (!existing) {
        // se non esiste, skip (nessun errore)
        continue;
      }

      // SE ESISTE, lo aggiorno con repository.bulkCreate/upsert o update singolo
      const updatedItem = await this.repo.model.update(payload, {
        where: {
          producerProfileId,
          date,
          hour,
        },
        returning: true,
        transaction: options?.transaction,
      });

      // updatedItem è [count, [updatedRow]]
      if (Array.isArray(updatedItem) && updatedItem[0] > 0) {
        const updatedSlot = (updatedItem as any)[1][0];
        results.push(updatedSlot);
      }
    }

    return results;
  }
}