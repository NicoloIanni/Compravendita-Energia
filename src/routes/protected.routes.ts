import { Router } from "express";
import { authenticateJWT } from "../middlewares/auth";

const router = Router();

// Endpoint di test protetto da JWT
router.get("/ping", authenticateJWT, (req, res) => {
  return res.status(200).json({ ok: true, message: "pong" });
});

export default router;
