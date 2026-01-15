import { QueryInterface } from "sequelize";
import bcrypt from "bcrypt";

export async function up(queryInterface: QueryInterface) {
  await queryInterface.bulkInsert("Users", [
    {
      email: "admin@example.com",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "admin",
      credit: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      email: "producer@example.com",
      passwordHash: await bcrypt.hash("producer123", 10),
      role: "producer",
      credit: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      email: "consumer@example.com",
      passwordHash: await bcrypt.hash("consumer123", 10),
      role: "consumer",
      credit: 1000,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.bulkDelete("Users", {
    email: [
      "admin@example.com",
      "producer@example.com",
      "consumer@example.com"
    ]
  });
}
