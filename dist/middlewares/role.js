"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleMiddleware = void 0;
const roleMiddleware = (allowedRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthenticated" });
        }
        if (req.user.role !== allowedRole) {
            return res.status(403).json({ message: "Forbidden: insufficient role" });
        }
        next();
    };
};
exports.roleMiddleware = roleMiddleware;
