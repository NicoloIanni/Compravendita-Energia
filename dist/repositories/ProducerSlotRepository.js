"use strict";
// src/repositories/ProducerSlotRepository.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProducerSlotRepository = void 0;
class ProducerSlotRepository {
    constructor({ producerSlotModel }) {
        this.model = producerSlotModel;
    }
    async upsertBatch(slots, transaction) {
        const ops = slots.map(slot => this.model.upsert(slot, { transaction }));
        await Promise.all(ops);
    }
    async findByProducerDateHour(producerProfileId, date, hour, transaction) {
        return this.model.findOne({
            where: {
                producerProfileId,
                date,
                hour,
            },
            transaction,
        });
    }
}
exports.ProducerSlotRepository = ProducerSlotRepository;
