import { QueryInterface } from "sequelize";

export default {
  async up(queryInterface: QueryInterface) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3); // +72h

    const dateStr = futureDate.toISOString().split("T")[0];

    await queryInterface.bulkInsert("ProducerSlots", [
      {
        id: 1,
        producerProfileId: 1,
        date: dateStr,
        hour: 12,
        capacityKwh: 100,
        pricePerKwh: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("ProducerSlots", {});
  },
};
