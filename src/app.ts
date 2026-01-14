import express from 'express';
import { healthRouter } from './routes/health.routes';
import { errorHandler } from './middlewares/errorHandler';

export const app = express();

app.use(express.json());
app.use(healthRouter);
app.use(errorHandler);
