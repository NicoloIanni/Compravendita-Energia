import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body ?? {};
  const adminUser = process.env.ADMIN_USER ?? "admin";
  const adminPass = process.env.ADMIN_PASS ?? "admin";
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ error: "JWT_SECRET not configured" });
  }

  // stub minimal: accetta solo admin/admin (o env)
  if (username !== adminUser || password !== adminPass) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { sub: username, role: "admin" },
    secret,
    { expiresIn: "1h" }
  );

  return res.status(200).json({ token });
});

export default router;

