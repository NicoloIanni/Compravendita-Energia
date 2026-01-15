import { DataTypes, QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable("Reservations", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    consumerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    producerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    hour: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    requestedKwh: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    allocatedKwh: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM("PENDING", "ALLOCATED", "CANCELLED"),
      allowNull: false,
      defaultValue: "PENDING"
    },
    totalCostCharged: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
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

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable("Reservations");
}
