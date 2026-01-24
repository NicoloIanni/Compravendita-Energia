import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import type { InferAttributes, InferCreationAttributes } from "sequelize";

@Table({
  tableName: "ProducerSlots",
  indexes: [
    {
      unique: true,
      fields: ["producerProfileId", "date", "hour"],
      name: "unique_producer_slot_per_hour",
    },
  ],
})
export default class ProducerSlot extends Model<
  InferAttributes<ProducerSlot>,
  InferCreationAttributes<ProducerSlot>
> {
  @ForeignKey(() => require("./ProducerProfile").default)
  @Column(DataType.INTEGER)
  producerProfileId!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  date!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  hour!: number;

  @Column({ type: DataType.FLOAT, allowNull: false })
  capacityKwh!: number;

  @Column({ type: DataType.FLOAT, allowNull: false })
  pricePerKwh!: number;

  // === soft-delete flags ===
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  deleted!: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deletedAt!: Date | null;

  @BelongsTo(() => require("./ProducerProfile").default)
  producerProfile?: any;
}
