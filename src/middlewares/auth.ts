import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Estendiamo il Request per includere profileId
export interface AuthRequest extends Request {
  user?: {
    userId: number;
    profileId: number; // aggiunto
    role: string;
  };
}

export const authenticateJWT = (
  req: AuthRequest,
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

    const payload = jwt.verify(token, secret) as any;

    // 🧠 Attenzione qui: assicuriamoci che il JWT includa anche profileId
    if (!payload.userId || !payload.role || !payload.profileId) {
      return res.status(401).json({ error: "Token privo di claims necessari" });
    }

    req.user = {
      userId: payload.userId,
      profileId: payload.profileId, // ora corretto
      role: payload.role,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token non valido" });
  }
};
