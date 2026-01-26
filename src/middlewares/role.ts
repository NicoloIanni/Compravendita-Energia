import { Request, Response, NextFunction } from "express";

/**
 * Tipologia dei ruoli supportati dal sistema.
 * Viene usata per garantire type safety.
 */
type Role = "admin" | "producer" | "consumer";

/**
 * Middleware di autorizzazione basato su ruolo (RBAC).
 *
 * Deve essere SEMPRE usato DOPO authenticateJWT.
 *
 * Esempio:
 *   roleMiddleware("producer")
 */
export const roleMiddleware = (allowedRole: Role) => {
  return (req: Request, res: Response, next: NextFunction) => {
    /**
     * Se req.user non esiste significa che:
     * - il middleware di autenticazione non è stato eseguito
     * - oppure il token era invalido
     */
    if (!req.user) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

     /**
     * Controllo del ruolo:
     * se il ruolo dell'utente non coincide con quello richiesto
     * l'accesso viene negato.
     */
    if (req.user.role !== allowedRole) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }

    // Ruolo valido → continua
    next();
  };
};
