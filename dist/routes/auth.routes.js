"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwt = __importStar(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const ProducerProfile_1 = __importDefault(require("../models/ProducerProfile"));
const router = (0, express_1.Router)();
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "email e password obbligatorie" });
        }
        const user = await User_1.default.findOne({ where: { email } });
        if (!user)
            return res.status(401).json({ error: "Credenziali non valide" });
        const match = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!match)
            return res.status(401).json({ error: "Credenziali non valide" });
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: "Configurazione server errata" });
        }
        const payload = {
            userId: user.id,
            role: user.role,
        };
        // 🔥 SOLO SE PRODUCER → carico profileId
        if (user.role === "producer") {
            const profile = await ProducerProfile_1.default.findOne({
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
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Errore interno" });
    }
});
exports.default = router;
