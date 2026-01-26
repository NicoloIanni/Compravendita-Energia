import { QueryInterface } from "sequelize";
import { addHours, format } from "date-fns";

// Seed di una reservation di esempio
export default {
  async up(queryInterface: QueryInterface) {
    // Recupera un consumer
    const [[consumer]]: any = await queryInterface.sequelize.query(`
      SELECT id, credit
      FROM "Users"
      WHERE role = 'consumer'
      LIMIT 1;
    `);

    if (!consumer) {
      throw new Error("No consumer found for reservation seed");
    }

    // 2Recupera uno slot produttore
    const [[slot]]: any = await queryInterface.sequelize.query(`
      SELECT *
      FROM "ProducerSlots"
      LIMIT 1;
    `);

    if (!slot) {
      throw new Error("No producer slot found for reservation seed");
    }

    // Calcolo dati prenotazione
    const requestedKwh = 5;
    const totalCost = requestedKwh * slot.pricePerKwh;

    // Verifica credito sufficiente
    if (consumer.credit < totalCost) {
      throw new Error("Consumer has insufficient credit for seed reservation");
    }

    // Inserisce la reservation
    // Stato PENDING per simulare una prenotazione non ancora risolta
    await queryInterface.bulkInsert("Reservations", [
      {
        consumerId: consumer.id,
        producerProfileId: slot.producerProfileId,
        date: slot.date,
        hour: slot.hour,
        requestedKwh,
        allocatedKwh: 5,               // inizialmente uguale alla richiesta
        status: "PENDING",
        totalCostCharged: totalCost,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Scala il credito del consumer
    // Simula il comportamento reale del ReservationService
    await queryInterface.sequelize.query(`
      UPDATE "Users"
      SET credit = credit - ${totalCost}
      WHERE id = ${consumer.id};
    `);
  },

  // Rollback seed Reservations
  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("Reservations", {});
  },
};
