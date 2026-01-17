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

    const payload = jwt.verify(token, secret) as any;

    if (!payload.userId || !payload.role) {
      return res.status(401).json({ error: "Token privo di claims necessari" });
    }

    // user base (valido per tutti)
    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    // solo producer ha profileId
    if (payload.role === "producer") {
      if (!payload.profileId) {
        return res.status(401).json({ error: "Producer token senza profileId" });
      }
      req.user.profileId = payload.profileId;
    }

    next();
  } catch {
    return res.status(401).json({ error: "Token non valido" });
  }
};
