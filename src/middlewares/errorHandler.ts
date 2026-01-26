import { Request, Response, NextFunction } from "express";

/**
 * Middleware globale di gestione errori.
 *
 * Intercetta tutte le eccezioni propagate tramite next(err).
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err);

  /**
   * Se l'errore ha uno status definito (es. DomainError),
   * viene utilizzato quello.
   * Altrimenti default a 500.
   */
  const status = err.status ?? 500;

  // usa il message dell’errore, altrimenti un default
  const message = err.message || "Internal Server Error";

  res.status(status).json({ error: message });
}
