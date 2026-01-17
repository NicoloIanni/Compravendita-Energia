import { Router } from "express";
import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import User from "../models/User";
import ProducerProfile from "../models/ProducerProfile";


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

    const payload: any = {
      userId: user.id,
      role: user.role,
    };

    // 🔥 SOLO SE PRODUCER → carico profileId
    if (user.role === "producer") {
      const profile = await ProducerProfile.findOne({
        where: { userId: user.id },
      });

      if (!profile) {
        return res
          .status(500)
          .json({ error: "Producer senza profile associato" });
      }

      payload.profileId = profile.id;
    }

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.json({ accessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Errore interno" });
  }
});


export default router;
