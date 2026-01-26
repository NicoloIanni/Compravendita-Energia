import { QueryInterface } from "sequelize";

// Migration di allineamento naming: producerId -> producerProfileId
// Gestisce in modo "safe" sia ProducerSlots che Reservations
export async function up(queryInterface: QueryInterface): Promise<void> {
  // =========================
  // --- ProducerSlots ---
  // =========================

  // Descrive la struttura attuale della tabella ProducerSlots
  // Serve per capire se una colonna esiste prima di modificarla
  const slots = await queryInterface.describeTable("ProducerSlots");

  // Se esiste producerId e NON esiste producerProfileId,
  // significa che la migration di rename non è ancora stata applicata
  if (slots.producerId && !slots.producerProfileId) {
    // Rimozione del vecchio vincolo di foreign key
    // (nome coerente con la migration precedente)
    await queryInterface.removeConstraint(
      "ProducerSlots",
      "fk_producerslots_producerId_profiles_id"
    );

    // Rinomina della colonna producerId -> producerProfileId
    // I dati vengono mantenuti, cambia solo il nome
    await queryInterface.renameColumn(
      "ProducerSlots",
      "producerId",
      "producerProfileId"
    );

    // Ricreazione del vincolo di foreign key con il nuovo nome di colonna
    await queryInterface.addConstraint("ProducerSlots", {
      fields: ["producerProfileId"],                   // Colonna FK aggiornata
      type: "foreign key",                             // Tipo di vincolo
      name: "fk_producerslots_producerProfileId_profiles_id", // Nome esplicito
      references: { table: "ProducerProfiles", field: "id" }, // Tabella referenziata
      onDelete: "CASCADE",                             // Eliminazione a cascata
      onUpdate: "CASCADE",                             // Aggiornamento a cascata
    });
  }

  // =========================
  // --- Reservations ---
  // =========================

  // Descrive la struttura attuale della tabella Reservations
  // La migration originale non è garantita, quindi il check è "difensivo"
  const reservations = await queryInterface.describeTable("Reservations");

  // Se esiste producerId e NON esiste producerProfileId,
  // va fatto il rename anche qui
  if (reservations.producerId && !reservations.producerProfileId) {
    // Tentativo di rimozione del vecchio vincolo FK.
    // Se il vincolo non esiste, la removeConstraint lancia errore:
    // il try/catch evita il fallimento della migration.
    try {
      await queryInterface.removeConstraint(
        "Reservations",
        "fk_reservations_producerId_profiles_id"
      );
    } catch {}

    // Rinomina della colonna producerId -> producerProfileId
    await queryInterface.renameColumn(
      "Reservations",
      "producerId",
      "producerProfileId"
    );

    // Ricreazione del vincolo di foreign key aggiornato
    await queryInterface.addConstraint("Reservations", {
      fields: ["producerProfileId"],                   // Nuova colonna FK
      type: "foreign key",                             // Tipo di vincolo
      name: "fk_reservations_producerProfileId_profiles_id", // Nome esplicito
      references: { table: "ProducerProfiles", field: "id" }, // Tabella referenziata
      onDelete: "CASCADE",                             // Eliminazione a cascata
      onUpdate: "CASCADE",                             // Aggiornamento a cascata
    });
  }
}

// Funzione di rollback della migration
// Riporta i nomi delle colonne allo stato precedente
export async function down(queryInterface: QueryInterface): Promise<void> {
  // =========================
  // --- ProducerSlots ---
  // =========================

  // Descrizione della tabella ProducerSlots per controllo esistenza colonne
  const slots = await queryInterface.describeTable("ProducerSlots");

  // Se esiste producerProfileId e NON esiste producerId,
  // significa che il rename è stato applicato e va annullato
  if (slots.producerProfileId && !slots.producerId) {
    // Rimozione del vincolo FK basato su producerProfileId
    await queryInterface.removeConstraint(
      "ProducerSlots",
      "fk_producerslots_producerProfileId_profiles_id"
    );

    // Rinomina inversa: producerProfileId -> producerId
    await queryInterface.renameColumn(
      "ProducerSlots",
      "producerProfileId",
      "producerId"
    );

    // Ricreazione del vincolo FK originale
    await queryInterface.addConstraint("ProducerSlots", {
      fields: ["producerId"],                          // Colonna FK originale
      type: "foreign key",                             // Tipo di vincolo
      name: "fk_producerslots_producerId_profiles_id", // Nome originale del vincolo
      references: { table: "ProducerProfiles", field: "id" }, // Tabella referenziata
      onDelete: "CASCADE",                             // Eliminazione a cascata
      onUpdate: "CASCADE",                             // Aggiornamento a cascata
    });
  }

  // =========================
  // --- Reservations ---
  // =========================

  // Descrizione della tabella Reservations
  const reservations = await queryInterface.describeTable("Reservations");

  // Se esiste producerProfileId e NON esiste producerId,
  // va ripristinato il nome originale della colonna
  if (reservations.producerProfileId && !reservations.producerId) {
    // Tentativo di rimozione del vincolo FK aggiornato
    // Il try/catch evita errori se il vincolo non esiste
    try {
      await queryInterface.removeConstraint(
        "Reservations",
        "fk_reservations_producerProfileId_profiles_id"
      );
    } catch {}

    // Rinomina inversa della colonna
    await queryInterface.renameColumn(
      "Reservations",
      "producerProfileId",
      "producerId"
    );

    // Tentativo di ricreazione del vincolo FK originale
    try {
      await queryInterface.addConstraint("Reservations", {
        fields: ["producerId"],                        // Colonna FK originale
        type: "foreign key",                           // Tipo di vincolo
        name: "fk_reservations_producerId_profiles_id",// Nome originale del vincolo
        references: { table: "ProducerProfiles", field: "id" }, // Tabella referenziata
        onDelete: "CASCADE",                           // Eliminazione a cascata
        onUpdate: "CASCADE",                           // Aggiornamento a cascata
      });
    } catch {}
  }
}
