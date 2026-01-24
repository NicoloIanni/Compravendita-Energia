import ProducerProfile from "../models/ProducerProfile";
import { InferCreationAttributes } from "sequelize";
import User from "../models/User";

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
  private profileModel = ProducerProfile;
  private userModel = User;

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
