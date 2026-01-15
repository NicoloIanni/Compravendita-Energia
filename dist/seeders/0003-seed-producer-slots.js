"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
async function up(queryInterface) {
    // Recupero ProducerProfile.id partendo dall’email del producer
    const [rows] = await queryInterface.sequelize.query(`
    SELECT pp.id
    FROM "ProducerProfiles" pp
    JOIN "Users" u ON u.id = pp."userId"
    WHERE u.email = 'producer@example.com'
    LIMIT 1;
    `);
    const producerProfileId = rows[0]?.id;
    if (!producerProfileId) {
        throw new Error("ProducerProfile non trovato per producer@example.com");
    }
    await queryInterface.bulkInsert("ProducerSlots", [
        {
            producerProfileId,
            date: tomorrow,
            hour: 8,
            capacityKwh: 100,
            pricePerKwh: 0.15,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            producerProfileId,
            date: tomorrow,
            hour: 9,
            capacityKwh: 120,
            pricePerKwh: 0.15,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ]);
}
async function down(queryInterface) {
    await queryInterface.bulkDelete("ProducerSlots", {
        date: tomorrow,
    });
}
