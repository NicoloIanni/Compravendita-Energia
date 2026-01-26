import { QueryInterface, DataTypes } from "sequelize";

// Migration Sequelize in formato ES module
// Introduce il supporto alla soft delete sugli slot del produttore
export default {
  // Migration up: aggiunge le colonne di soft delete
  up: async (
    queryInterface: QueryInterface
  ): Promise<void> => {
    // Colonna booleana che indica se lo slot è logicamente eliminato
    // false -> slot attivo
    // true  -> slot disattivato
    await queryInterface.addColumn("ProducerSlots", "deleted", {
      type: DataTypes.BOOLEAN,   
      allowNull: false,         
      defaultValue: false,       
    });

    // Timestamp di eliminazione logica
    // Serve per eventuali audit o analisi storiche
    await queryInterface.addColumn("ProducerSlots", "deletedAt", {
      type: DataTypes.DATE,      
      allowNull: true,           
    });
  },

  // Migration down: rimuove le colonne aggiunte
  down: async (
    queryInterface: QueryInterface
  ): Promise<void> => {
    // Rimozione della colonna deleted
    await queryInterface.removeColumn("ProducerSlots", "deleted");

    // Rimozione della colonna deletedAt
    await queryInterface.removeColumn("ProducerSlots", "deletedAt");
  },
};
