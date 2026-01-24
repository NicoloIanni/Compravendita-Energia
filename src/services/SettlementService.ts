import { sequelize } from "../db";
import { UserRepository } from "../repositories/UserRepository";
import { ProducerSlotRepository } from "../repositories/ProducerSlotRepository";
import { ReservationRepository } from "../repositories/ReservationRepository";


export class SettlementService {
  constructor(
    private userRepository: UserRepository,
    private producerSlotRepository: ProducerSlotRepository,
    private reservationRepository: ReservationRepository
  ) {}

  async resolveDay(producerProfileId: number, date: string) {
    return sequelize.transaction(async (t) => {
      const slots = await this.producerSlotRepository.findForResolveByProducerAndDate(
        producerProfileId,
        date,
        t
      );

      let resolvedHours = 0;
      let oversubscribedHours = 0;

      for (const slot of slots) {
        const reservations =
          await this.reservationRepository.findPendingForResolveBySlot(
            producerProfileId,
            date,
            slot.hour,
            t
          );

        if (reservations.length === 0) continue;

        const capacity = slot.capacityKwh;
        const price = slot.pricePerKwh;

        const sumRequested = reservations.reduce(
          (s, r) => s + r.requestedKwh,
          0
        );

        let allocations = new Map<number, number>();

// SE NON oversubscription
if (sumRequested <= capacity) {
  for (const r of reservations) {
    allocations.set(r.id, r.requestedKwh);
  }
} else {
  oversubscribedHours++;

  // calcolo proporzionale
  const factor = capacity / sumRequested;
  let allocatedSoFar = 0;

  for (const r of reservations) {
    const alloc = parseFloat((r.requestedKwh * factor).toFixed(6));
    allocations.set(r.id, alloc);
    allocatedSoFar += alloc;
  }

  // corregge eventuali scarti di rounding
  const roundingDiff = parseFloat(
    (capacity - allocatedSoFar).toFixed(6)
  );

  if (roundingDiff !== 0 && reservations.length > 0) {
    const firstId = reservations[0].id;
    const corrected = parseFloat(
      ((allocations.get(firstId) ?? 0) + roundingDiff).toFixed(6)
    );
    allocations.set(firstId, corrected);
  }
}
        const refundsByConsumer = new Map<number, number>();

        for (const r of reservations) {
          const allocated = allocations.get(r.id)!;
          const allocatedClamped = Math.min(allocated, r.requestedKwh);

          const refundKwh = Number(
            (r.requestedKwh - allocatedClamped).toFixed(3)
          );

          if (refundKwh > 0) {
            const refund = Number((refundKwh * price).toFixed(3));
            refundsByConsumer.set(
              r.consumerId,
              Number(
                ((refundsByConsumer.get(r.consumerId) ?? 0) + refund).toFixed(3)
              )
            );
          }

          r.allocatedKwh = allocatedClamped;
          r.totalCostCharged = Number(
            (allocatedClamped * price).toFixed(3)
          );
          r.status = "ALLOCATED";

          await this.reservationRepository.save(r, t);
        }

        for (const [consumerId, refund] of refundsByConsumer) {
          const consumer = await this.userRepository.findByIdForUpdate(
            consumerId,
            t
          );
          consumer.credit = Number((consumer.credit + refund).toFixed(3));
          await this.userRepository.save(consumer, t);
        }

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
