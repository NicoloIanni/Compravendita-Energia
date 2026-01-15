import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

router.get("/ping", authenticateJWT, (req, res) => {
  return res.status(200).json({ ok: true, message: "pong" });
});

export default router;