// src/repositories/UserRepository.ts

import { Transaction } from "sequelize";
import User from "../models/User";
import { InferCreationAttributes } from "sequelize";

export class UserRepository {
  
async create(
  data: InferCreationAttributes<User>,
  options: { transaction?: Transaction } = {}
): Promise<User> {
  return User.create(data, options);
}
async findByRole(role: "producer" | "consumer") {
  return User.findAll({
    where: { role },
    attributes: ["id", "email", "role", "credit"],
    order: [["id", "ASC"]],
  });
}
  /* =========================
   * FIND BY ID
   * ========================= */
  async findById(
    id: number,
    tx?: Transaction
  ): Promise<User | null> {
    return User.findByPk(id, { transaction: tx });
  }

  /* =========================
   * FIND BY ID FOR UPDATE (LOCK)
   * ========================= */
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

  /* =========================
   * SAVE (UNICO METODO)
   * ========================= */
  async save(user: User, tx?: Transaction): Promise<User> {
    return user.save({ transaction: tx });
  }
}
