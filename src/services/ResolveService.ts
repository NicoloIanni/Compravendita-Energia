import { sequelize } from "../db";
import { UserRepository } from "../repositories/UserRepository";
import { ProducerSlotRepository } from "../repositories/ProducerSlotRepository";
import { ReservationRepository } from "../repositories/ReservationRepository";

import { AllocationStrategyFactory } from "../strategies/AllocationStrategyFactory";


// prende tutte le PENDING di un produttore per una data e le converte in ALLOCATED
// applicando una strategia (no cut o proportional cut) e rimborsando differenze
export class SettlementService {
  constructor(
    // user repo: serve a lockare e rimborsare credito al consumer
    private userRepository: UserRepository,
    // slot repo: serve a lockare slot e fare soft delete post-resolve
    private producerSlotRepository: ProducerSlotRepository,
    // reservation repo: serve a lockare PENDING e salvarle in ALLOCATED
    private reservationRepository: ReservationRepository
  ) { }

  // Risolve tutte le richieste per un produttore e una data
  // Dentro una singola transazione: coerenza tra allocazioni e rimborsi
  async resolveDay(producerProfileId: number, date: string) {
    return sequelize.transaction(async (tx) => {
      // Recupera tutti gli slot del produttore per la data
      // Con lock UPDATE per prevenire resolve concorrenti
      const slots =
        await this.producerSlotRepository.findForResolveByProducerAndDate(
          producerProfileId,
          date,
          tx
        );

      // Contatori per output finale (utile per stats/log)
      let resolvedHours = 0;
      let oversubscribedHours = 0;

      for (const slot of slots) {
        // Recupera tutte le prenotazioni PENDING per lo slot con lock
        const reservations =
          await this.reservationRepository.findPendingForResolveBySlot(
            producerProfileId,
            date,
            slot.hour,
            tx
          );

        // Se non ci sono richieste, non c’è nulla da risolvere
        if (reservations.length === 0) continue;

        // Totale kWh richiesti nello slot
        const totalRequested = reservations.reduce(
          (sum, r) => sum + r.requestedKwh,
          0
        );

        // Se oversubscription (richieste > capacità)
        if (totalRequested > slot.capacityKwh) {
          oversubscribedHours++;
        }

        // Selezione strategy di allocazione:
        // - NoCut se totalRequested <= capacity
        // - ProportionalCut se totalRequested > capacity
        const strategy = AllocationStrategyFactory.select(
          totalRequested,
          slot.capacityKwh
        );

        // Calcolo allocazioni per ciascuna reservation
        // Output: Map<reservationId, allocatedKwh>
        const allocations = strategy.allocate(reservations, slot);

        // Aggiorna ogni reservation PENDING -> ALLOCATED
        for (const reservation of reservations) {
          const allocatedKwh = allocations.get(reservation.id);

          // Allocazione mancante = errore
          if (allocatedKwh === undefined) {
            throw new Error(
              `Allocation missing for reservation ${reservation.id}`
            );
          }

          // Aggiorna quantità allocata e stato
          reservation.allocatedKwh = allocatedKwh;
          reservation.status = "ALLOCATED";

          // Addebito finale basato su allocato
          // (con il taglio, il costo scende ed una parte viene rimborsata)
          reservation.totalCostCharged =
            allocatedKwh * slot.pricePerKwh;

          // Salva la reservation aggiornata
          await this.reservationRepository.save(reservation, tx);

          // Refund se c’è stato taglio (allocated < requested)
          if (allocatedKwh < reservation.requestedKwh) {
            // Rimborso in crediti = differenza kWh * prezzo
            const refund =
              (reservation.requestedKwh - allocatedKwh) *
              slot.pricePerKwh;

            // Lock del consumer per evitare race conditions sul credito
            const consumer = await this.userRepository.findByIdForUpdate(
              reservation.consumerId,
              tx
            );

            // Aggiorna credito
            consumer.credit = Number(consumer.credit) + refund;
            await this.userRepository.save(consumer, tx);
          }
        }


        // Soft delete dello slot dopo il resolve:
        // - evita future prenotazioni/letture come slot “attivo”
        // - mantiene dati storici per stats/audit
        await this.producerSlotRepository.softDelete(
          {
            producerProfileId: slot.producerProfileId,
            date: slot.date,
            hour: slot.hour,
          },
          tx
        );

        resolvedHours++;
      }

      // Output finale: utile per endpoint /me/requests/resolve
      return {
        date,
        resolvedHours,
        oversubscribedHours,
      };
    });
  }
}
