import { DataTypes, QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable("ProducerProfiles", {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    energyType: {
      type: DataTypes.ENUM("Fossile", "Eolico", "Fotovoltaico"),
      allowNull: false
    },
    co2_g_per_kwh: {
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

export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable("ProducerProfiles");
}
