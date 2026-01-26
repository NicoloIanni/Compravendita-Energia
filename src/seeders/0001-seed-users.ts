import { QueryInterface } from "sequelize";
import bcrypt from "bcrypt";

// Seed iniziale della tabella Users
// Crea tre utenti base: admin, producer e consumer
export async function up(queryInterface: QueryInterface) {
  await queryInterface.bulkInsert("Users", [
    {
      // Account admin
      email: "admin@example.com",
      passwordHash: await bcrypt.hash("admin123", 10), // hash sicuro password
      role: "admin",
      credit: 0, // admin non usa credito
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      // Account producer
      email: "producer@example.com",
      passwordHash: await bcrypt.hash("producer123", 10),
      role: "producer",
      credit: 0, // il produttore non consuma credito
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      // Account consumer
      email: "consumer@example.com",
      passwordHash: await bcrypt.hash("consumer123", 10),
      role: "consumer",
      credit: 1000, // credito iniziale per test prenotazioni
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);
}

// Rollback del seed utenti
export async function down(queryInterface: QueryInterface) {
  await queryInterface.bulkDelete("Users", {
    email: [
      "admin@example.com",
      "producer@example.com",
      "consumer@example.com"
    ]
  });
}
