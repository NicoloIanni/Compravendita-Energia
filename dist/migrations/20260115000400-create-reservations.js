"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up(queryInterface) {
    await queryInterface.createTable("Reservations", {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        consumerId: {
            type: sequelize_1.DataTypes.INTEGER,
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
        requestedKwh: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false
        },
        allocatedKwh: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        status: {
            type: sequelize_1.DataTypes.ENUM("PENDING", "ALLOCATED", "CANCELLED"),
            allowNull: false,
            defaultValue: "PENDING"
        },
        totalCostCharged: {
            type: sequelize_1.DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 0
        },
        createdAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false
        },
        updatedAt: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false
        }
    });
    await queryInterface.addConstraint("Reservations", {
        fields: ["consumerId"],
        type: "foreign key",
        name: "fk_reservations_consumerId_users_id",
        references: {
            table: "Users",
            field: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
    await queryInterface.addConstraint("Reservations", {
        fields: ["producerId"],
        type: "foreign key",
        name: "fk_reservations_producerId_profiles_id",
        references: {
            table: "ProducerProfiles",
            field: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
}
async function down(queryInterface) {
    await queryInterface.dropTable("Reservations");
}
