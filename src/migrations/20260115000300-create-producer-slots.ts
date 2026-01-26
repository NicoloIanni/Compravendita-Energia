import { DataTypes, QueryInterface } from "sequelize";

// Migration Sequelize: crea la tabella ProducerSlots
// Questa tabella rappresenta gli slot orari (1h) messi a disposizione dai produttori
export async function up(queryInterface: QueryInterface) {
  // Creazione della tabella ProducerSlots
  await queryInterface.createTable("ProducerSlots", {
    // Chiave primaria dello slot
    id: {
      type: DataTypes.INTEGER,     
      primaryKey: true,            
      autoIncrement: true,         
      allowNull: false             
    },

    // Riferimento al profilo del produttore (ProducerProfiles.id)
    producerId: {
      type: DataTypes.INTEGER,     
      allowNull: false             
    },

    // Data dello slot (formato YYYY-MM-DD)
    // Nel dominio del progetto rappresenta il giorno "domani"
    date: {
      type: DataTypes.DATEONLY,    
      allowNull: false             
    },

    // Ora dello slot (valori attesi: 0–23)
    hour: {
      type: DataTypes.INTEGER,     
      allowNull: false             
    },

    // Capacità massima erogabile in questo slot orario (kWh)
    capacityKwh: {
      type: DataTypes.FLOAT,       
      allowNull: false             
    },

    // Prezzo per ogni kWh in questo slot
    pricePerKwh: {
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

  // Aggiunta del vincolo di foreign key verso ProducerProfiles
  // Garantisce che ogni slot sia associato a un produttore valido
  await queryInterface.addConstraint("ProducerSlots", {
    fields: ["producerId"],                         
    type: "foreign key",                            
    name: "fk_producerslots_producerId_profiles_id",
    references: {
      table: "ProducerProfiles",                   
      field: "id"                                  
    },
    onDelete: "CASCADE",                            // Eliminando il produttore, elimina anche gli slot
    onUpdate: "CASCADE"                             // Aggiorna la FK se cambia l'id del produttore
  });
}

// Funzione di rollback della migration
// Viene eseguita in caso di undo della migration
export async function down(queryInterface: QueryInterface) {
  // Eliminazione completa della tabella ProducerSlots
  await queryInterface.dropTable("ProducerSlots");
}
