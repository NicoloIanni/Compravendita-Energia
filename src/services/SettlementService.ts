import { sequelize } from "../db";
import { UserRepository } from "../repositories/UserRepository";
import { ProducerSlotRepository } from "../repositories/ProducerSlotRepository";
import { ReservationRepository } from "../repositories/ReservationRepository";

import { AllocationStrategyFactory } from "../strategies/AllocationStrategyFactory";

export class SettlementService {
  constructor(
    private userRepository: UserRepository,
    private producerSlotRepository: ProducerSlotRepository,
    private reservationRepository: ReservationRepository
  ) { }

  async resolveDay(producerProfileId: number, date: string) {
    return sequelize.transaction(async (tx) => {
      // prendo tutti gli slot per la data
      const slots =
        await this.producerSlotRepository.findForResolveByProducerAndDate(
          producerProfileId,
          date,
          tx
        );

      let resolvedHours = 0;
      let oversubscribedHours = 0;

      for (const slot of slots) {
        const reservations =
          await this.reservationRepository.findPendingForResolveBySlot(
            producerProfileId,
            date,
            slot.hour,
            tx
          );

        // se non ci sono richieste, passo oltre
        if (reservations.length === 0) continue;

        const totalRequested = reservations.reduce(
          (sum, r) => sum + r.requestedKwh,
          0
        );

        if (totalRequested > slot.capacityKwh) {
          oversubscribedHours++;
        }

        // selezione della strategy di allocazione
        const strategy = AllocationStrategyFactory.select(
          totalRequested,
          slot.capacityKwh
        );

        const allocations = strategy.allocate(reservations, slot);

        // aggiorno tutte le reservation
        for (const reservation of reservations) {
          const allocatedKwh = allocations.get(reservation.id);
          if (allocatedKwh === undefined) {
            throw new Error(
              `Allocation missing for reservation ${reservation.id}`
            );
          }

          reservation.allocatedKwh = allocatedKwh;
          reservation.status = "ALLOCATED";

          reservation.totalCostCharged =
            allocatedKwh * slot.pricePerKwh;

          await this.reservationRepository.save(reservation, tx);

          // refund se c’è stato taglio
          if (allocatedKwh < reservation.requestedKwh) {
            const refund =
              (reservation.requestedKwh - allocatedKwh) *
              slot.pricePerKwh;

            const consumer = await this.userRepository.findByIdForUpdate(
              reservation.consumerId,
              tx
            );

            consumer.credit = Number(consumer.credit) + refund;
            await this.userRepository.save(consumer, tx);
          }
        }

        // =============================
        // SOFT DELETE DELLO SLOT
        // =============================
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

      return {
        date,
        resolvedHours,
        oversubscribedHours,
      };
    });
  }
}
