import dotenv from "dotenv";

// Carica le variabili d’ambiente dal file .env
// Deve essere eseguito prima di usare process.env
dotenv.config();

import app from "./app";
import { env } from "./config/env";
import { sequelize } from "./db";

// Funzione di bootstrap dell’applicazione
// Serve a inizializzare le dipendenze critiche
// prima di avviare il server HTTP
async function bootstrap() {

  // Verifica immediata della connessione al database
  // Se il DB non è raggiungibile l’app NON parte
  // (approccio "fail fast")
  await sequelize.authenticate();
  console.log("DB connected");

  // Avvio del server Express
  // 0.0.0.0 permette l’ascolto su tutte le interfacce
  // (necessario in Docker / container)
  app.listen(env.port, "0.0.0.0", () => {
    console.log(`API listening on 0.0.0.0:${env.port}`);
  });
}

// Avvio del bootstrap
// In caso di errore:
// - log
// - uscita immediata del processo
bootstrap().catch((e) => {
  console.error("Startup failed:", e);
  process.exit(1);
});
