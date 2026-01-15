"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
async function up(queryInterface) {
    // Consumer
    const [consumerRows] = await queryInterface.sequelize.query(`
    SELECT id
    FROM "Users"
    WHERE email = 'consumer@example.com'
    LIMIT 1;
    `);
    const consumerId = consumerRows[0]?.id;
    if (!consumerId) {
        throw new Error("Consumer non trovato per consumer@example.com");
    }
    // ProducerProfile
    const [ppRows] = await queryInterface.sequelize.query(`
    SELECT pp.id
    FROM "ProducerProfiles" pp
    JOIN "Users" u ON u.id = pp."userId"
    WHERE u.email = 'producer@example.com'
    LIMIT 1;
    `);
    const producerProfileId = ppRows[0]?.id;
    if (!producerProfileId) {
        throw new Error("ProducerProfile non trovato per producer@example.com");
    }
    await queryInterface.bulkInsert("Reservations", [
        {
            consumerId,
            producerProfileId,
            date: tomorrow,
            hour: 8,
            requestedKwh: 20,
            allocatedKwh: 20,
            status: "ALLOCATED",
            totalCostCharged: 20 * 0.15,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ]);
}
async function down(queryInterface) {
    await queryInterface.bulkDelete("Reservations", {
        date: tomorrow,
    });
}
