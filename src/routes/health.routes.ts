import { Router } from 'express';

export const healthRouter = Router();

// Endpoint di health check
// Usato per test, docker, monitoring
healthRouter.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});
