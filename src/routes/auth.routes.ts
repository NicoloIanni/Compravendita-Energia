import { Router } from "express";
import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import User from "../models/User";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email e password obbligatorie" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: "Credenziali non valide" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: "Credenziali non valide" });

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Configurazione server errata" });
    }

    const secret: jwt.Secret = process.env.JWT_SECRET;

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      secret,
      { expiresIn: 3600 } // 1 ora in secondi
    );

    return res.json({ accessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Errore interno" });
  }
});

export default router;
