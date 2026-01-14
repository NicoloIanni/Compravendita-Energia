import { Router } from "express";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/ping", requireAuth, (req, res) => {
  return res.status(200).json({ ok: true, message: "pong" });
});

export default router;