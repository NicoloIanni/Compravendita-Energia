import 'dotenv/config';

// Oggetto di configurazione centralizzato dell'applicazione
// Tutte le variabili di ambiente vengono lette una sola volta qui
// e poi riutilizzate nel resto del progetto
export const env = {
  // Porta su cui avviare il server Express
  // Se PORT non è definita nell'ambiente, usa 3000 come default
  port: Number(process.env.PORT ?? 3000),

  // Configurazione del database PostgreSQL
  db: {
    // Host del database (container o localhost)
    host: process.env.DB_HOST ?? 'localhost',

    // Porta del database
    port: Number(process.env.DB_PORT ?? 5432),

    // Nome del database
    name: process.env.DB_NAME ?? 'energy',

    // Utente del database
    user: process.env.DB_USER ?? 'app',

    // Password del database
    password: process.env.DB_PASSWORD ?? 'app',
  },

  // Chiave segreta usata per firmare e verificare i JWT
  // In assenza di variabile d'ambiente viene usata una chiave di sviluppo
  // (accettabile solo in ambiente dev/test)
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
};
