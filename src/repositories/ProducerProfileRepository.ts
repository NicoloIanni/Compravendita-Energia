import ProducerProfile from "../models/ProducerProfile";
import { InferCreationAttributes } from "sequelize";

export class ProducerProfileRepository {
async createProfile(
    data: InferCreationAttributes<ProducerProfile>,
    options: any = {}
  ): Promise<ProducerProfile> {
    return (await ProducerProfile.create(
      data,
      options
    )) as ProducerProfile;
  }
  async findByUserId(userId: number) {
    return ProducerProfile.findOne({ where: { userId } });
  }
}
