"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
const bcrypt_1 = __importDefault(require("bcrypt"));
async function up(queryInterface) {
    await queryInterface.bulkInsert("Users", [
        {
            email: "admin@example.com",
            passwordHash: await bcrypt_1.default.hash("admin123", 10),
            role: "admin",
            credit: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            email: "producer@example.com",
            passwordHash: await bcrypt_1.default.hash("producer123", 10),
            role: "producer",
            credit: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            email: "consumer@example.com",
            passwordHash: await bcrypt_1.default.hash("consumer123", 10),
            role: "consumer",
            credit: 1000,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ]);
}
async function down(queryInterface) {
    await queryInterface.bulkDelete("Users", {
        email: [
            "admin@example.com",
            "producer@example.com",
            "consumer@example.com"
        ]
    });
}
