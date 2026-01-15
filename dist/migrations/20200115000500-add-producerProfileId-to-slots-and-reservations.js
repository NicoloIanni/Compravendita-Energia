"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up(queryInterface) {
    await queryInterface.addColumn("ProducerSlots", "producerProfileId", {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    });
}
async function down(queryInterface) {
    await queryInterface.removeColumn("ProducerSlots", "producerProfileId");
}
