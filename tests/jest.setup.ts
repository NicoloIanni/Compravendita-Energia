import "reflect-metadata";
import dotenv from "dotenv";
import { sequelize } from "../src/config/db";

dotenv.config({ path: ".env" });
afterAll(async () => {
  await sequelize.close();
});