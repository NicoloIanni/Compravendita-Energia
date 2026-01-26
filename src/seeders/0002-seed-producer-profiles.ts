import { QueryInterface } from "sequelize";

// Seed del profilo produttore
export async function up(queryInterface: QueryInterface) {
  // Recupera l'utente producer creato nel seed precedente
  const users = await queryInterface.sequelize.query(
    `SELECT id FROM "Users" WHERE email = 'producer@example.com' LIMIT 1;`
  );

  // Estrae l'id del producer
  const producerId = (users[0] as any[])[0]?.id;
  if (!producerId) throw new Error("Producer user non trovato");

  // Inserisce il profilo produttore
  await queryInterface.bulkInsert("ProducerProfiles", [
    {
      userId: producerId,             // FK verso Users
      energyType: "Fotovoltaico",      // tipo di energia prodotta
      co2_g_per_kwh: 50,               // impronta CO₂ per kWh
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ]);
}

// Rollback seed ProducerProfile
export async function down(queryInterface: QueryInterface) {
  await queryInterface.bulkDelete("ProducerProfiles", {
    energyType: "Fotovoltaico"
  });
}
