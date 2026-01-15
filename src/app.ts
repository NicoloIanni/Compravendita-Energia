import "./models";
import "./db";
import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import { healthRouter } from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import protectedRoutes from './routes/protected.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
export default app;

app.use(express.json());

app.use(healthRouter);
app.use('/auth', authRoutes);
app.use('/protected', protectedRoutes);

// SEMPRE ultimo
app.use(errorHandler);