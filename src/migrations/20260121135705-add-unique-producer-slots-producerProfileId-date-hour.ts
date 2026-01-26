import type { QueryInterface } from "sequelize";

// Migration Sequelize in formato CommonJS
// Aggiunge un vincolo UNIQUE sugli slot del produttore
module.exports = {
  // Migration up: viene eseguita applicando la migration
  async up(queryInterface: QueryInterface) {
    // Aggiunta vincolo UNIQUE composito sulla tabella ProducerSlots
    // Impedisce la creazione di più slot per lo stesso produttore,
    // nella stessa data e nella stessa ora
    await queryInterface.addConstraint("ProducerSlots", {
      fields: ["producerProfileId", "date", "hour"], // Colonne coinvolte nel vincolo
      type: "unique",                                // Tipo di vincolo
      name: "unique_producer_slot_per_hour",         // Nome esplicito del vincolo
    });
  },

  // Migration down: rollback della migration
  async down(queryInterface: QueryInterface) {
    // Rimozione del vincolo UNIQUE precedentemente aggiunto
    await queryInterface.removeConstraint(
      "ProducerSlots",
      "unique_producer_slot_per_hour"
    );
  },
};
