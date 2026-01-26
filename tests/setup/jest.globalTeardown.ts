import { sequelize } from "../../src/db";

/**
 * Questo file viene eseguito da Jest
 * DOPO che tutti i test sono terminati (globalTeardown)
 */
export default async () => {
  console.log("🔌 [JEST] Close DB connection");

  // Chiude esplicitamente la connessione Sequelize
  // Evita warning tipo:
  // "Jest did not exit one second after the test run has completed"
  await sequelize.close();
};
