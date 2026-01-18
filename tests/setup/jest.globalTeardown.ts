import { sequelize } from "../../src/db";

export default async () => {
  console.log("🔌 [JEST] Close DB connection");
  await sequelize.close();
};
