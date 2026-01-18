import { execSync } from "child_process";
import dotenv from "dotenv";

process.env.NODE_ENV = "test";

export default async () => {
  // 🔹 carica env TEST
  dotenv.config({ path: ".env.test" });

  const run = (cmd: string) =>
    execSync(cmd, { stdio: "inherit", env: process.env });

  console.log("🧨 [JEST] Drop DB (force)");
  try {
    run("npx sequelize-cli db:drop --env test");
  } catch {
    console.warn("⚠️ DB non esistente, skip drop");
  }

  console.log("🧱 [JEST] Create DB");
  run("npx sequelize-cli db:create --env test");

  console.log("📦 [JEST] Migrate");
  run("npx sequelize-cli db:migrate --env test");

  console.log("🌱 [JEST] Seed");
  run("npx sequelize-cli db:seed:all --env test");
};
