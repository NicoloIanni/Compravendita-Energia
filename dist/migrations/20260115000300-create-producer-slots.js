"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up(queryInterface) {
    await queryInterface.createTable("ProducerSlots", {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        producerId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false
        },
        date: {
            type: sequelize_1.DataTypes.DATEONLY,
            allowNull: false
        },
        hour: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false
        },
        capacityKwh: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false
        },
        pricePerKwh: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false
        },
        createdAt: {
            allowNull: false,
            type: sequelize_1.DataTypes.DATE
        },
        updatedAt: {
            allowNull: false,
            type: sequelize_1.DataTypes.DATE
        }
    });
    await queryInterface.addConstraint("ProducerSlots", {
        fields: ["producerId"],
        type: "foreign key",
        name: "fk_producerslots_producerId_profiles_id",
        references: {
            table: "ProducerProfiles",
            field: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
}
async function down(queryInterface) {
    await queryInterface.dropTable("ProducerSlots");
}
