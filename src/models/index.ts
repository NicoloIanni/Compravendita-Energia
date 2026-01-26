import User from "./User";
import ProducerProfile from "./ProducerProfile";
import ProducerSlot from "./ProducerSlot";
import Reservation from "./Reservation";

// File index dei modelli
// Serve a importare ed esportare tutti i modelli Sequelize
// senza creare cicli di import espliciti nei singoli file
// (le associazioni vengono risolte da sequelize-typescript)
export {
  User,
  ProducerProfile,
  ProducerSlot,
  Reservation,
};
