import { DataTypes, QueryInterface } from "sequelize";

// Migration Sequelize: crea la tabella Reservations
// Questa tabella memorizza le prenotazioni effettuate dai consumer
// sugli slot orari dei produttori
export async function up(queryInterface: QueryInterface) {
  // Creazione della tabella Reservations
  await queryInterface.createTable("Reservations", {
    // Chiave primaria della prenotazione
    id: {
      type: DataTypes.INTEGER,     
      primaryKey: true,            
      autoIncrement: true,         
      allowNull: false            
    },

    // Riferimento al consumer che effettua la prenotazione (Users.id)
    consumerId: {
      type: DataTypes.INTEGER,     
      allowNull: false             
    },

    // Riferimento al profilo del produttore (ProducerProfiles.id)
    producerId: {
      type: DataTypes.INTEGER,     
      allowNull: false            
    },

    // Data dello slot prenotato (YYYY-MM-DD)
    date: {
      type: DataTypes.DATEONLY,    
      allowNull: false             
    },

    // Ora dello slot prenotato (valori attesi: 0–23)
    hour: {
      type: DataTypes.INTEGER,     
      allowNull: false             
    },

    // Quantità di energia richiesta dal consumer (kWh)
    requestedKwh: {
      type: DataTypes.FLOAT,       
      allowNull: false             
    },

    // Quantità di energia effettivamente allocata dopo la risoluzione
    // Inizialmente è 0 e viene valorizzata durante il resolve del produttore
    allocatedKwh: {
      type: DataTypes.FLOAT,       
      allowNull: false,            
      defaultValue: 0              
    },

    // Stato della prenotazione
    // PENDING   -> prenotazione creata ma non ancora risolta
    // ALLOCATED -> prenotazione risolta e allocata
    // CANCELLED -> prenotazione annullata dal consumer
    status: {
      type: DataTypes.ENUM("PENDING", "ALLOCATED", "CANCELLED"), 
      allowNull: false,                                          
      defaultValue: "PENDING"                                    
    },

    // Costo totale addebitato al consumer
    // Può essere aggiornato in caso di taglio proporzionale o cancellazione
    totalCostCharged: {
      type: DataTypes.FLOAT,       
      allowNull: false,            
      defaultValue: 0             
    },

    // Timestamp di creazione del record
    createdAt: {
      type: DataTypes.DATE,        
      allowNull: false             
    },

    // Timestamp di ultimo aggiornamento del record
    updatedAt: {
      type: DataTypes.DATE,        
      allowNull: false             
    }
  });

  // Vincolo di foreign key verso Users (consumer)
  // Garantisce che il consumer esista
  await queryInterface.addConstraint("Reservations", {
    fields: ["consumerId"],                     // Colonna FK
    type: "foreign key",                        // Tipo di vincolo
    name: "fk_reservations_consumerId_users_id",// Nome esplicito del vincolo
    references: {
      table: "Users",                           // Tabella referenziata
      field: "id"                               // Colonna referenziata
    },
    onDelete: "CASCADE",                        // Eliminando l'utente, elimina le prenotazioni
    onUpdate: "CASCADE"                         // Aggiorna la FK se cambia l'id
  });

  // Vincolo di foreign key verso ProducerProfiles (produttore)
  // Garantisce che il produttore esista
  await queryInterface.addConstraint("Reservations", {
    fields: ["producerId"],                     // Colonna FK
    type: "foreign key",                        // Tipo di vincolo
    name: "fk_reservations_producerId_profiles_id", // Nome esplicito del vincolo
    references: {
      table: "ProducerProfiles",                // Tabella referenziata
      field: "id"                               // Colonna referenziata
    },
    onDelete: "CASCADE",                        // Eliminando il produttore, elimina le prenotazioni
    onUpdate: "CASCADE"                         // Aggiorna la FK se cambia l'id
  });
}

// Funzione di rollback della migration
// Viene eseguita con sequelize db:migrate:undo
export async function down(queryInterface: QueryInterface) {
  // Eliminazione completa della tabella Reservations
  await queryInterface.dropTable("Reservations");
}
