"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const sequelize_1 = require("sequelize");
async function up(queryInterface) {
    await queryInterface.createTable("ProducerProfiles", {
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        userId: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false
        },
        energyType: {
            type: sequelize_1.DataTypes.ENUM("Fossile", "Eolico", "Fotovoltaico"),
            allowNull: false
        },
        co2_g_per_kwh: {
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
    // vincolo FK verso Users.id
    await queryInterface.addConstraint("ProducerProfiles", {
        fields: ["userId"],
        type: "foreign key",
        name: "fk_producerprofiles_userId_users_id",
        references: {
            table: "Users",
            field: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    });
}
async function down(queryInterface) {
    await queryInterface.dropTable("ProducerProfiles");
}
