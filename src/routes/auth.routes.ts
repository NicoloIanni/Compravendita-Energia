import { Router } from "express";
import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import User from "../models/User";
import ProducerProfile from "../models/ProducerProfile";

const router = Router();

// Endpoint di login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validazione input minimo
    if (!email || !password) {
      return res.status(400).json({ error: "email e password obbligatorie" });
    }

    // Ricerca utente per email
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: "Credenziali non valide" });

    // Confronto password con hash salvato
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: "Credenziali non valide" });

    // Verifica configurazione JWT
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Configurazione server errata" });
    }

    // Payload base del JWT
    const payload: any = {
      userId: user.id,
      role: user.role,
    };

    // SOLO SE PRODUCER:
    // carichiamo anche producerProfileId nel token
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

    // Generazione JWT con scadenza 1h
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
