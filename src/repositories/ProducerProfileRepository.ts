import ProducerProfile from "../models/ProducerProfile";
import { InferCreationAttributes } from "sequelize";
import User from "../models/User";

// Repository per l'accesso ai dati di ProducerProfile
// Incapsula l'uso diretto di Sequelize
export class ProducerProfileRepository {

  // Crea un nuovo profilo produttore
  // options serve per passare transaction o altre opzioni Sequelize
  async createProfile(
    data: InferCreationAttributes<ProducerProfile>,
    options: any = {}
  ): Promise<ProducerProfile> {
    return (await ProducerProfile.create(
      data,
      options
    )) as ProducerProfile;
  }

  // Trova il profilo produttore associato a uno specifico userId
  async findByUserId(userId: number) {
    return ProducerProfile.findOne({ where: { userId } });
  }

  // Riferimenti ai modelli (usati per include)
  private profileModel = ProducerProfile;
  private userModel = User;

  // Recupera tutti i produttori con i dati base dell'utente associato
  async findAllProducers() {
    return this.profileModel.findAll({
      include: [
        {
          model: this.userModel,
          as: "user",
          attributes: ["id", "email", "role"],
        },
      ],
    });
  }
}
