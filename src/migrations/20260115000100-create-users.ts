import { DataTypes, QueryInterface } from "sequelize";

/**
 * Migration: create-users
 *
 * Scopo:
 * - creare la tabella users
 * - rappresenta l'entità base di autenticazione
 *
 * Questa tabella viene usata da:
 * - admin
 * - producer
 * - consumer
 */
export async function up(queryInterface: QueryInterface) {
  await queryInterface.createTable("Users", {
    /**
     * Chiave primaria.
     * Identificatore univoco dell'utente.
     */
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    /**
     * Email dell'utente.
     * Deve essere unica perché usata per il login.
     */
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    /**
     * Hash della password.
     * NON viene mai salvata la password in chiaro.
     */
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    /**
     * Ruolo dell'utente.
     * Valori ammessi:
     * - admin
     * - producer
     * - consumer
     */
    role: {
      type: DataTypes.ENUM("admin", "producer", "consumer"),
      allowNull: false
    },
    /**
     * Credito/token disponibile.
     * Usato solo per i consumer, ma presente per tutti
     * per semplicità di modello.
     */
    credit: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    /**
     * Timestamp Sequelize standard.
     */
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  });
}
/**
 * Rollback migration.
 * Elimina completamente la tabella users.
 */
export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable("Users");
}
