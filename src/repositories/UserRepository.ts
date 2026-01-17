import { Transaction } from "sequelize";
import User from "../models/User";

export class UserRepository {
  async findById(
    id: number,
    tx?: Transaction
  ): Promise<User | null> {
    return User.findByPk(id, { transaction: tx });
  }

  async save(
    user: User,
    tx?: Transaction
  ): Promise<void> {
    await user.save({ transaction: tx });
  }
}
