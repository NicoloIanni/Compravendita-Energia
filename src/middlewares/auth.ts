import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token mancante o malformato" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "JWT_SECRET not set" });
    }

  
    const payload =
  process.env.NODE_ENV === "test"
    ? jwt.verify(token, secret, { ignoreExpiration: true })
    : jwt.verify(token, secret)as any;

    if (!payload.userId || !payload.role) {
      return res.status(401).json({ error: "Token privo di claims necessari" });
    }

    // 🔹 JWT middleware: SOLO autenticazione, niente logica di ruolo
    req.user = {
      userId: payload.userId,
      role: payload.role,
      profileId: payload.profileId, // opzionale
    };

    next();
  } catch {
    return res.status(401).json({ error: "Token non valido" });
  }
};
