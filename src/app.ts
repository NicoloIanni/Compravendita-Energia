
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import producerRoutes from "./routes/producer.routes";
import consumerRoutes from "./routes/consumer.routes";
import authRoutes from "./routes/auth.routes";
import { healthRouter } from "./routes/health.routes";
import protectedRoutes from "./routes/protected.routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(express.json());

// Routes
app.use("/producers", producerRoutes);
app.use("/consumers", consumerRoutes);
app.use("/auth", authRoutes);
app.use("/protected", protectedRoutes);
app.use(healthRouter);

// Error handler (SEMPRE ultimo)
app.use(errorHandler);

export default app;
