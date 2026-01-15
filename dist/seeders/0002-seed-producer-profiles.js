"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(queryInterface) {
    // Trova producer
    const users = await queryInterface.sequelize.query(`SELECT id FROM "Users" WHERE email = 'producer@example.com' LIMIT 1;`);
    const producerId = users[0][0]?.id;
    if (!producerId)
        throw new Error("Producer user non trovato");
    await queryInterface.bulkInsert("ProducerProfiles", [
        {
            userId: producerId,
            energyType: "Fotovoltaico",
            co2_g_per_kwh: 50,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    ]);
}
async function down(queryInterface) {
    await queryInterface.bulkDelete("ProducerProfiles", {
        energyType: "Fotovoltaico"
    });
}
