"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get("/ping", auth_1.authenticateJWT, (req, res) => {
    return res.status(200).json({ ok: true, message: "pong" });
});
exports.default = router;
