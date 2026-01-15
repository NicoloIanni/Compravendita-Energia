import { QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // --- ProducerSlots ---
  const slots = await queryInterface.describeTable("ProducerSlots");

  // Se esiste producerId e NON esiste producerProfileId -> facciamo rename
  if (slots.producerId && !slots.producerProfileId) {
    // rimuovi constraint FK vecchia (nome che hai nella tua migration)
    await queryInterface.removeConstraint(
      "ProducerSlots",
      "fk_producerslots_producerId_profiles_id"
    );

    // rinomina colonna
    await queryInterface.renameColumn(
      "ProducerSlots",
      "producerId",
      "producerProfileId"
    );

    // ricrea FK con nome nuovo
    await queryInterface.addConstraint("ProducerSlots", {
      fields: ["producerProfileId"],
      type: "foreign key",
      name: "fk_producerslots_producerProfileId_profiles_id",
      references: { table: "ProducerProfiles", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }

  // --- Reservations ---
  // Qui non mi hai incollato la migration, quindi faccio un check "safe":
  const reservations = await queryInterface.describeTable("Reservations");

  if (reservations.producerId && !reservations.producerProfileId) {
    // Provo a rimuovere una eventuale constraint se esiste.
    // Se non c'è, questa removeConstraint fallirebbe: quindi prima controlliamo via try/catch.
    try {
      await queryInterface.removeConstraint(
        "Reservations",
        "fk_reservations_producerId_profiles_id"
      );
    } catch {}

    await queryInterface.renameColumn(
      "Reservations",
      "producerId",
      "producerProfileId"
    );

    // Ricreo FK (se per voi producerId puntava a ProducerProfiles)
    await queryInterface.addConstraint("Reservations", {
      fields: ["producerProfileId"],
      type: "foreign key",
      name: "fk_reservations_producerProfileId_profiles_id",
      references: { table: "ProducerProfiles", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // --- ProducerSlots ---
  const slots = await queryInterface.describeTable("ProducerSlots");

  if (slots.producerProfileId && !slots.producerId) {
    await queryInterface.removeConstraint(
      "ProducerSlots",
      "fk_producerslots_producerProfileId_profiles_id"
    );

    await queryInterface.renameColumn(
      "ProducerSlots",
      "producerProfileId",
      "producerId"
    );

    await queryInterface.addConstraint("ProducerSlots", {
      fields: ["producerId"],
      type: "foreign key",
      name: "fk_producerslots_producerId_profiles_id",
      references: { table: "ProducerProfiles", field: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
  }

  // --- Reservations ---
  const reservations = await queryInterface.describeTable("Reservations");

  if (reservations.producerProfileId && !reservations.producerId) {
    try {
      await queryInterface.removeConstraint(
        "Reservations",
        "fk_reservations_producerProfileId_profiles_id"
      );
    } catch {}

    await queryInterface.renameColumn(
      "Reservations",
      "producerProfileId",
      "producerId"
    );

    try {
      await queryInterface.addConstraint("Reservations", {
        fields: ["producerId"],
        type: "foreign key",
        name: "fk_reservations_producerId_profiles_id",
        references: { table: "ProducerProfiles", field: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    } catch {}
  }
}
