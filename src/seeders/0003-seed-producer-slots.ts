import { QueryInterface } from "sequelize";

// Seed di uno slot produttore
export default {
  async up(queryInterface: QueryInterface) {

    // Inserisce uno slot di esempio
    await queryInterface.bulkInsert("ProducerSlots", [
      {
        id: 1,                         // id esplicito per semplicità nei seed
        producerProfileId: 1,          // FK verso ProducerProfiles
        date: "2000-01-01",            // data fittizia (>24h per i test)
        hour: 12,                      // fascia oraria
        capacityKwh: 100,              // capacità disponibile
        pricePerKwh: 5,                // prezzo unitario
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Allinea la sequence PostgreSQL all'id massimo inserito
    // Evita conflitti su insert successivi
    await queryInterface.sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('"ProducerSlots"', 'id'),
        (SELECT MAX(id) FROM "ProducerSlots")
      );
    `);
  },

  // Rollback seed ProducerSlots
  async down(queryInterface: QueryInterface) {
    await queryInterface.bulkDelete("ProducerSlots", {});
  },
};
