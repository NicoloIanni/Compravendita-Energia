import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        profileId: number;
        role: string;
      };
    }
  }
}
