import { DataTypes, QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable("ProducerSlots", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    capacityKwh: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    pricePerKwh: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
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

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable("ProducerSlots");
}
