import { Request, Response, NextFunction } from "express";

type Role = "admin" | "producer" | "consumer";

export const roleMiddleware = (allowedRole: Role) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    if (req.user.role !== allowedRole) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }

    next();
  };
};
