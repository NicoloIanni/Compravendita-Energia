import { QueryInterface } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {

    await queryInterface.bulkInsert("ProducerSlots", [
      {
        id: 1,
        producerProfileId: 1,
        date: "2000-01-01",
        hour: 12,
        capacityKwh: 100,
        pricePerKwh: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
        await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"ProducerSlots"', 'id'),
        (SELECT MAX(id) FROM "ProducerSlots")
      );
    `);

  },
  

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("ProducerSlots", {});
  },
};
