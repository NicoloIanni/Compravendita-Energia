"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, _req, res, _next) {
    console.error(err);
    // usa lo status dell’errore se presente, altrimenti 500
    const status = err.status ?? 500;
    // usa il message dell’errore, altrimenti un default
    const message = err.message || "Internal Server Error";
    res.status(status).json({ error: message });
}
