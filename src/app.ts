import dotenv from "dotenv";

// Carica le variabili d’ambiente dal file .env
// Deve essere fatto prima di usare process.env in qualunque altro file
dotenv.config();

import express from "express";

// Import delle route per i vari domini dell’applicazione
import producerRoutes from "./routes/producer.routes";
import consumerRoutes from "./routes/consumer.routes";
import authRoutes from "./routes/auth.routes";
import { healthRouter } from "./routes/health.routes";
import protectedRoutes from "./routes/protected.routes";
import adminRoutes from "./routes/admin.routes";

// Middleware globale di gestione errori
import { errorHandler } from "./middlewares/errorHandler";

// Istanza principale dell’app Express
const app = express();

// Middleware per il parsing del body JSON
// Necessario per leggere req.body nelle POST / PATCH
app.use(express.json());

// =========================
// Registrazione delle routes
// =========================

// Rotte amministrative (solo admin)
// Esempi: creazione producer / consumer, listing utenti
app.use("/admin", adminRoutes);

// Rotte lato producer
// Gestione slot, richieste, resolve, stats, earnings
app.use("/producers", producerRoutes);

// Rotte lato consumer
// Prenotazioni, acquisti, carbon footprint
app.use("/consumers", consumerRoutes);

// Rotte di autenticazione
// Login → JWT
app.use("/auth", authRoutes);

// Rotte protette di test (ping con JWT valido)
app.use("/protected", protectedRoutes);

// Health check pubblico
// Usato per verificare che il servizio sia attivo
app.use(healthRouter);


// Middleware di gestione errori
// DEVE essere sempre l’ultimo middleware registrato
// Intercetta errori lanciati da controller/service
app.use(errorHandler);

// Export dell’app (usata da server.ts o dai test)
export default app;
