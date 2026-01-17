"use strict";
// src/services/ProducerSlotService.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProducerSlotService = void 0;
class ProducerSlotService {
    constructor({ producerSlotRepository }) {
        this.repo = producerSlotRepository;
    }
    validateCommon(item) {
        const errors = [];
        if (!item.date)
            errors.push("date mancante");
        if (item.hour == null || item.hour < 0 || item.hour > 23)
            errors.push("hour deve essere tra 0 e 23");
        return errors;
    }
    validateCapacityItem(item) {
        const errors = this.validateCommon(item);
        if (item.capacityKwh == null || item.capacityKwh < 0) {
            errors.push("capacityKwh deve essere >= 0");
        }
        if (errors.length) {
            const err = new Error(errors.join("; "));
            err.status = 400;
            throw err;
        }
    }
    validatePriceItem(item) {
        const errors = this.validateCommon(item);
        if (item.pricePerKwh == null || item.pricePerKwh < 0) {
            errors.push("pricePerKwh deve essere >= 0");
        }
        if (errors.length) {
            const err = new Error(errors.join("; "));
            err.status = 400;
            throw err;
        }
    }
    makeUpsertCapacity(profileId, items) {
        return items.map(item => ({
            producerProfileId: profileId,
            date: item.date,
            hour: item.hour,
            capacityKwh: item.capacityKwh,
            pricePerKwh: item.pricePerKwh ?? 0,
        }));
    }
    makeUpsertPrice(profileId, items) {
        return items.map(item => ({
            producerProfileId: profileId,
            date: item.date,
            hour: item.hour,
            pricePerKwh: item.pricePerKwh,
            capacityKwh: item.capacityKwh ?? 0,
        }));
    }
    async batchUpdateCapacity(profileId, slots, options) {
        slots.forEach(this.validateCapacityItem.bind(this));
        const toUpsert = this.makeUpsertCapacity(profileId, slots);
        return this.repo.upsertBatch(toUpsert, options.transaction);
    }
    async batchUpdatePrice(profileId, slots, options) {
        slots.forEach(this.validatePriceItem.bind(this));
        const toUpsert = this.makeUpsertPrice(profileId, slots);
        return this.repo.upsertBatch(toUpsert, options.transaction);
    }
}
exports.ProducerSlotService = ProducerSlotService;
