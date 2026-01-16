import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import type { InferAttributes, InferCreationAttributes } from "sequelize";

@Table({ tableName: "Reservations" })
export default class Reservation extends Model<
InferAttributes<Reservation>,
InferCreationAttributes<Reservation>>  {
  @ForeignKey(() => require("./User").default)
  @Column(DataType.INTEGER)
  consumerId!: number;

  @ForeignKey(() => require("./ProducerProfile").default)
  @Column(DataType.INTEGER)
  producerProfileId!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  date!: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  hour!: number;

  @Column({ type: DataType.FLOAT, allowNull: false })
  requestedKwh!: number;

  @Column({ type: DataType.FLOAT, allowNull: false })
  allocatedKwh!: number;

  @Column({
    type: DataType.ENUM("PENDING", "ALLOCATED", "CANCELLED"),
    allowNull: false,
  })
  status!: string;

  @Column({ type: DataType.FLOAT, allowNull: false })
  totalCostCharged!: number;

  @BelongsTo(() => require("./User").default, "consumerId")
  consumer?: any;

  @BelongsTo(() => require("./ProducerProfile").default, "producerProfileId")
  producerProfile?: any;
}
