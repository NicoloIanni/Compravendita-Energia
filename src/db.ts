import "dotenv/config";
import { Sequelize } from "sequelize-typescript";
import {
  User,
  ProducerProfile,
  ProducerSlot,
  Reservation,
} from "./models";

export const sequelize = new Sequelize({
  dialect: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  models: [User, ProducerProfile, ProducerSlot, Reservation],
  logging: false,
});

ProducerProfile.hasMany(ProducerSlot, {
  foreignKey: "producerProfileId",
});

ProducerSlot.belongsTo(ProducerProfile, {
  foreignKey: "producerProfileId",
});

ProducerProfile.hasMany(Reservation, {
  foreignKey: "producerProfileId",
});

Reservation.belongsTo(ProducerProfile, {
  foreignKey: "producerProfileId",
});
