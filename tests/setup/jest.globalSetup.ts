import { execSync } from "child_process";
import dotenv from "dotenv";

// Forziamo l'ambiente di test
process.env.NODE_ENV = "test";

/**
 * Questo file viene eseguito da Jest
 * PRIMA di tutti i test (globalSetup)
 */
export default async () => {
  // Carica le variabili d'ambiente dal file .env.test
  // Serve per usare DB, credenziali e config dedicate ai test
  dotenv.config({ path: ".env.test" });

  /**
   * Helper per eseguire comandi shell
   * - stdio: inherit → stampa output in console
   * - env: process.env → passa variabili d’ambiente a sequelize-cli
   */
  const run = (cmd: string) =>
    execSync(cmd, { stdio: "inherit", env: process.env });

  // =========================
  // RESET COMPLETO DATABASE
  // =========================

  console.log("🧨 [JEST] Drop DB (force)");
  try {
    // Elimina il database di test se esiste
    // --env test → usa configurazione test in sequelize-cli
    run("npx sequelize-cli db:drop --env test");
  } catch {
    // Se il DB non esiste, non è un errore bloccante
    console.warn("⚠️ DB non esistente, skip drop");
  }

  console.log("🧱 [JEST] Create DB");
  // Crea un database vuoto per i test
  run("npx sequelize-cli db:create --env test");

  console.log("📦 [JEST] Migrate");
  // Applica TUTTE le migration (schema aggiornato)
  run("npx sequelize-cli db:migrate --env test");

  console.log("🌱 [JEST] Seed");
  // Inserisce dati iniziali (admin, producer, consumer, slot, reservation, ecc.)
  run("npx sequelize-cli db:seed:all --env test");
};
