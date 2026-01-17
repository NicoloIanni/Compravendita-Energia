"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.patchPrice = exports.patchCapacity = void 0;
const db_1 = require("../config/db");
const producerSlotServiceInstance_1 = require("../services/producerSlotServiceInstance");
const patchCapacity = async (req, res, next) => {
    const body = req.body;
    const profileId = req.user?.profileId;
    const role = req.user?.role;
    // 401 se non autenticato
    if (!profileId) {
        return res.status(401).json({ error: "Producer non autenticato" });
    }
    // 403 se non producer
    if (role !== "producer") {
        return res.status(403).json({ error: "Accesso non consentito" });
    }
    let t = null;
    try {
        t = await db_1.sequelize.transaction();
        await producerSlotServiceInstance_1.producerSlotService.batchUpdateCapacity(profileId, body, {
            transaction: t,
        });
        await t.commit();
        return res.status(200).json({ success: true });
    }
    catch (err) {
        if (t)
            await t.rollback();
        next(err);
    }
};
exports.patchCapacity = patchCapacity;
const patchPrice = async (req, res, next) => {
    const body = req.body;
    const profileId = req.user?.profileId;
    const role = req.user?.role;
    // 401 se non autenticato
    if (!profileId) {
        return res.status(401).json({ error: "Producer non autenticato" });
    }
    // controllo ruolo producer anche qui
    if (role !== "producer") {
        return res.status(403).json({ error: "Accesso non consentito" });
    }
    let t = null;
    try {
        t = await db_1.sequelize.transaction();
        await producerSlotServiceInstance_1.producerSlotService.batchUpdatePrice(profileId, body, {
            transaction: t,
        });
        await t.commit();
        return res.status(200).json({ success: true });
    }
    catch (err) {
        if (t)
            await t.rollback();
        next(err);
    }
};
exports.patchPrice = patchPrice;
