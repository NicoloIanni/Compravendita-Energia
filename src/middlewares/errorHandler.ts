import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err);

  // usa lo status dell’errore se presente, altrimenti 500
  const status = err.status ?? 500;

  // usa il message dell’errore, altrimenti un default
  const message = err.message || "Internal Server Error";

  res.status(status).json({ error: message });
}
