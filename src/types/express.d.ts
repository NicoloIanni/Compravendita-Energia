import { UserRole } from "../models/User"; 

// Estensione globale dei tipi di Express
// Serve per aggiungere informazioni personalizzate all'oggetto Request
declare global {
  namespace Express {
    interface Request {
      // Oggetto `user` iniettato dal middleware di autenticazione JWT
      // È opzionale perché esiste solo dopo authenticateJWT
      user?: {
        // ID dell’utente autenticato (User.id)
        userId: number;

        // Ruolo dell’utente, usato dal roleMiddleware
        // Valori ammessi: admin | producer | consumer
        role: "admin" | "producer" | "consumer";

        // ID del ProducerProfile
        // Presente SOLO se role === "producer"
        // Serve per evitare query ripetute nei controller
        profileId?: number; 
      };
    }
  }
}

// Export vuoto necessario per dire a TypeScript
// che questo file è un modulo e non uno script globale
export {};
