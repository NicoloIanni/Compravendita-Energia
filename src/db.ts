import "dotenv/config";
import { Sequelize } from "sequelize-typescript";
import {
  User,
  ProducerProfile,
  ProducerSlot,
  Reservation,
} from "./models";

// =========================
// Inizializzazione Sequelize
// =========================

// Istanza Sequelize configurata per PostgreSQL
// Tutti i parametri vengono letti dalle variabili d’ambiente
export const sequelize = new Sequelize({
  dialect: "postgres",                 // Dialetto SQL utilizzato
  host: process.env.DB_HOST,            // Host del database
  port: Number(process.env.DB_PORT),    // Porta del database
  username: process.env.DB_USER,        // Utente DB
  password: process.env.DB_PASS,        // Password DB
  database: process.env.DB_NAME,        // Nome del database

  // Modelli Sequelize registrati
  // Sequelize-typescript usa questa lista per:
  // - mapping tabelle
  // - associazioni
  // - sync / migrations
  models: [User, ProducerProfile, ProducerSlot, Reservation],

  // Disabilita il logging SQL in console
  logging: false,
});

// =========================
// Definizione associazioni
// =========================

// Un ProducerProfile può avere molti ProducerSlot
ProducerProfile.hasMany(ProducerSlot, {
  foreignKey: "producerProfileId",
});

// Ogni ProducerSlot appartiene a un ProducerProfile
ProducerSlot.belongsTo(ProducerProfile, {
  foreignKey: "producerProfileId",
});

// Un ProducerProfile può avere molte Reservation
ProducerProfile.hasMany(Reservation, {
  foreignKey: "producerProfileId",
});

// Ogni Reservation appartiene a un ProducerProfile
Reservation.belongsTo(ProducerProfile, {
  foreignKey: "producerProfileId",
});
