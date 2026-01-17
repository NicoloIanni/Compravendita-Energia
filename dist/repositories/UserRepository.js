"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const User_1 = __importDefault(require("../models/User"));
class UserRepository {
    async findById(id, tx) {
        return User_1.default.findByPk(id, { transaction: tx });
    }
    async save(user, tx) {
        await user.save({ transaction: tx });
    }
}
exports.UserRepository = UserRepository;
