import { Transaction } from "sequelize";
import User from "../models/User";
import { InferCreationAttributes } from "sequelize";

// Repository per l'accesso ai dati User
export class UserRepository {

  // Crea un nuovo utente
  async create(
    data: InferCreationAttributes<User>,
    options: { transaction?: Transaction } = {}
  ): Promise<User> {
    return User.create(data, options);
  }

  // Recupera tutti gli utenti di un certo ruolo
  async findByRole(role: "producer" | "consumer") {
    return User.findAll({
      where: { role },
      attributes: ["id", "email", "role", "credit"],
      order: [["id", "ASC"]],
    });
  }


  // Recupera un utente per id
  async findById(
    id: number,
    tx?: Transaction
  ): Promise<User | null> {
    return User.findByPk(id, { transaction: tx });
  }

  // =========================
  // FIND BY ID FOR UPDATE (LOCK)
  // =========================

  // Recupera un utente con lock pessimista
  // Usato per operazioni su credito
  async findByIdForUpdate(
    id: number,
    tx: Transaction
  ): Promise<User> {
    const user = await User.findByPk(id, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!user) {
      throw new Error(`User not found: ${id}`);
    }

    return user;
  }


  // Salva un utente già caricato
  async save(user: User, tx?: Transaction): Promise<User> {
    return user.save({ transaction: tx });
  }
}
