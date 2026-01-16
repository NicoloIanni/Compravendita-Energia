import { Sequelize } from "sequelize-typescript";
import { env } from "./env";

// importa i tuoi model
import User from "../models/User";
import ProducerProfile from "../models/ProducerProfile";
import ProducerSlot from "../models/ProducerSlot";
import Reservation from "../models/Reservation";

export const sequelize = new Sequelize({
  database: env.db.name,
  username: env.db.user,
  password: env.db.password,
  host: env.db.host,
  port: env.db.port,
  dialect: "postgres",
  logging: false,
  models: [
    User,
    ProducerProfile,
    ProducerSlot,
    Reservation,
  ], // <-- qui registri TUTTI i model
});
