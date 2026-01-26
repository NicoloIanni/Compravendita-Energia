import { DataTypes, QueryInterface } from "sequelize";

// Migration Sequelize: funzione eseguita quando si applica la migration (sequelize db:migrate)
export async function up(queryInterface: QueryInterface) {
  // Creazione della tabella ProducerProfiles
  // Questa tabella contiene le informazioni specifiche dei produttori
  await queryInterface.createTable("ProducerProfiles", {
    // Chiave primaria del profilo produttore
    id: {
      type: DataTypes.INTEGER,       
      allowNull: false,              
      autoIncrement: true,           
      primaryKey: true               
    },

    // Riferimento all'utente (Users.id)
    // Identifica quale user è il produttore
    userId: {
      type: DataTypes.INTEGER,       
      allowNull: false               
    },

    // Tipologia di energia prodotta dal produttore
    // Valori ammessi: Fossile, Eolico, Fotovoltaico
    energyType: {
      type: DataTypes.ENUM("Fossile", "Eolico", "Fotovoltaico"), 
      allowNull: false                                           
    },

    // Emissioni di CO2 per ogni kWh prodotto
    // Usato per il calcolo della carbon footprint dei consumer
    co2_g_per_kwh: {
      type: DataTypes.FLOAT,         
      allowNull: false               
    },

    // Timestamp di creazione del record (gestito da Sequelize)
    createdAt: {
      allowNull: false,              
      type: DataTypes.DATE           
    },

    // Timestamp di ultimo aggiornamento del record
    updatedAt: {
      allowNull: false,              
      type: DataTypes.DATE           
    }
  });

  // Aggiunta vincolo di foreign key verso la tabella Users
  // Garantisce l'integrità referenziale tra ProducerProfiles e Users
  await queryInterface.addConstraint("ProducerProfiles", {
    fields: ["userId"],                          
    type: "foreign key",                         
    name: "fk_producerprofiles_userId_users_id", 
    references: {
      table: "Users",                            
      field: "id"                                
    },
    onDelete: "CASCADE",                         
    onUpdate: "CASCADE"                          
  });
}

// Funzione di rollback della migration
// Viene eseguita con sequelize db:migrate:undo
export async function down(queryInterface: QueryInterface) {
  // Eliminazione completa della tabella ProducerProfiles
  await queryInterface.dropTable("ProducerProfiles");
}
