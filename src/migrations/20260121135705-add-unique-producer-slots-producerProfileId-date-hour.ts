import type { QueryInterface } from "sequelize";

module.exports = {
  async up(queryInterface: QueryInterface) {
    await queryInterface.addConstraint("ProducerSlots", {
      fields: ["producerProfileId", "date", "hour"],
      type: "unique",
      name: "unique_producer_slot_per_hour",
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.removeConstraint(
      "ProducerSlots",
      "unique_producer_slot_per_hour"
    );
  },
};
