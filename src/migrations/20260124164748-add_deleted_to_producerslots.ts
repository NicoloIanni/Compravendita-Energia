// src/migrations/XXXXXXXXXXXX-add-deleted-to-producerslots.ts

import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (
    queryInterface: QueryInterface
  ): Promise<void> => {
    await queryInterface.addColumn("ProducerSlots", "deleted", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn("ProducerSlots", "deletedAt", {
      type: DataTypes.DATE,
      allowNull: true,
    });
  },

  down: async (
    queryInterface: QueryInterface
  ): Promise<void> => {
    await queryInterface.removeColumn("ProducerSlots", "deleted");
    await queryInterface.removeColumn("ProducerSlots", "deletedAt");
  },
};


