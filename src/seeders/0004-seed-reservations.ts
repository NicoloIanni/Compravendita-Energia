import { QueryInterface } from "sequelize";
import { addHours, format } from "date-fns";

export default {
  async up(queryInterface: QueryInterface) {
    // 1️⃣ recupera consumer
    const [[consumer]]: any = await queryInterface.sequelize.query(`
      SELECT id, credit
      FROM "Users"
      WHERE role = 'consumer'
      LIMIT 1;
    `);

    if (!consumer) {
      throw new Error("No consumer found for reservation seed");
    }

    // 2️⃣ recupera producer slot
    const [[slot]]: any = await queryInterface.sequelize.query(`
      SELECT *
      FROM "ProducerSlots"
      LIMIT 1;
    `);

    if (!slot) {
      throw new Error("No producer slot found for reservation seed");
    }

    // 3️⃣ dati reservation
    const requestedKwh = 1;
    const totalCost = requestedKwh * slot.pricePerKwh;

    if (consumer.credit < totalCost) {
      throw new Error("Consumer has insufficient credit for seed reservation");
    }

    // 4️⃣ crea reservation (>24h garantito dal seed slot)
    await queryInterface.bulkInsert("Reservations", [
      {
        consumerId: consumer.id,
        producerProfileId: slot.producerProfileId,
        date: slot.date,
        hour: slot.hour,
        requestedKwh,
        allocatedKwh: 0,
        status: "PENDING",
        totalCostCharged: totalCost,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // 5️⃣ scala il credito del consumer
    await queryInterface.sequelize.query(`
      UPDATE "Users"
      SET credit = credit - ${totalCost}
      WHERE id = ${consumer.id};
    `);
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("Reservations", {});
  },
};

