/**
 * Estensione dell'interfaccia Request di Express.
 * Aggiunge la proprietà `user`, che verrà popolata
 * dal middleware di autenticazione JWT.
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Middleware di autenticazione JWT.
 *
 * Responsabilità:
 * - verificare che l'header Authorization sia presente e ben formato
 * - validare il token JWT
 * - estrarre le informazioni minime dell'utente
 * - popolare req.user
 *
 * NOTA IMPORTANTE:
 * Questo middleware fa solo autenticazione, non controllo di ruolo.
 */
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Header atteso: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

/**
   * Controllo formato header:
   * deve iniziare con "Bearer "
   * Esempio valido:
   *   Authorization: Bearer eyJhbGciOi...
   */
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token mancante o malformato" });
  }
// Estrazione del token vero e proprio
  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Configurazione del server non valida" });
    }

      /**
     * Verifica del token:
     * - in ambiente test ignora la scadenza (utile per Jest)
     * - in altri ambienti verifica normalmente firma + exp
     */
    const payload =
  process.env.NODE_ENV === "test"
    ? jwt.verify(token, secret, { ignoreExpiration: true })
    : jwt.verify(token, secret)as any;

    if (!payload.userId || !payload.role) {
      return res.status(401).json({ error: "Token privo di claims necessari" });
    }

    /**
     * Popolamento di req.user.
     * Questo oggetto viene utilizzato:
     * - dai controller
     * - dai middleware di autorizzazione (roleMiddleware)
     */
    req.user = {
      userId: payload.userId,
      role: payload.role,
      profileId: payload.profileId, 
    };

    next();
  } catch {
    return res.status(401).json({ error: "Token non valido" });
  }
};
