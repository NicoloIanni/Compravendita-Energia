// src/repositories/UserRepository.ts

import { Transaction } from "sequelize";
import User from "../models/User";

export class UserRepository {
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
