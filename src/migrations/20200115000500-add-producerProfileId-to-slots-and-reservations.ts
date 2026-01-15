import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.addColumn("ProducerSlots", "producerProfileId", {
    type: DataTypes.INTEGER,
    allowNull: false,
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.removeColumn("ProducerSlots", "producerProfileId");
}
