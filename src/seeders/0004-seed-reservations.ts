import { QueryInterface } from "sequelize";

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  .toISOString()
  .split("T")[0];

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Consumer
  const [consumerRows] = await queryInterface.sequelize.query(
    `
    SELECT id
    FROM "Users"
    WHERE email = 'consumer@example.com'
    LIMIT 1;
    `
  );

  const consumerId = (consumerRows as any[])[0]?.id;
  if (!consumerId) {
    throw new Error("Consumer non trovato per consumer@example.com");
  }

  // ProducerProfile
  const [ppRows] = await queryInterface.sequelize.query(
    `
    SELECT pp.id
    FROM "ProducerProfiles" pp
    JOIN "Users" u ON u.id = pp."userId"
    WHERE u.email = 'producer@example.com'
    LIMIT 1;
    `
  );

  const producerProfileId = (ppRows as any[])[0]?.id;
  if (!producerProfileId) {
    throw new Error("ProducerProfile non trovato per producer@example.com");
  }

  await queryInterface.bulkInsert("Reservations", [
    {
      consumerId,
      producerProfileId,
      date: tomorrow,
      hour: 8,
      requestedKwh: 20,
      allocatedKwh: 20,
      status: "ALLOCATED",
      totalCostCharged: 20 * 0.15,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.bulkDelete("Reservations", {
    date: tomorrow,
  });
}
