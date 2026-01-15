"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token mancante o malformato" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({ error: "JWT_SECRET not set" });
        }
        const payload = jsonwebtoken_1.default.verify(token, secret);
        req.user = {
            userId: payload.userId,
            role: payload.role,
        };
        next();
    }
    catch (err) {
        return res.status(401).json({ error: "Token non valido" });
    }
};
exports.authenticateJWT = authenticateJWT;
