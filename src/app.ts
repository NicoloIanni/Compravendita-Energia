import "./routes/consumer.routes";
import "./models";
import "./db";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { healthRouter } from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import protectedRoutes from "./routes/protected.routes";
import { errorHandler } from "./middlewares/errorHandler";
import { authenticateJWT } from "./middlewares/auth";
import {
  patchCapacity,
  patchPrice,
} from "./controller/producerSlotsController";
import consumerRoutes from "./routes/consumer.routes";

const app = express();

// ➤ PRIMA registra il body parser
app.use(express.json());

// ➤ Route slots (PATCH)
app.patch(
  "/producers/me/slots/capacity",
  authenticateJWT,
  patchCapacity
);

app.patch(
  "/producers/me/slots/price",
  authenticateJWT,
  patchPrice
);

// ➤ altre route


app.use(consumerRoutes);
app.use(healthRouter);
app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);

// ➤ ERRORE handler (SEMPRE ultimo)
app.use(errorHandler);

export default app;
