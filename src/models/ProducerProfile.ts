import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";

@Table({ tableName: "ProducerProfiles" })
export default class ProducerProfile extends Model<ProducerProfile> {
  @ForeignKey(() => require("./User").default)
  @Column(DataType.INTEGER)
  userId!: number;

  @Column({
    type: DataType.ENUM("Fossile", "Eolico", "Fotovoltaico"),
    allowNull: false,
  })
  energyType!: string;

  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
  co2_g_per_kwh!: number;

  @BelongsTo(() => require("./User").default)
  user?: any;

  @HasMany(() => require("./ProducerSlot").default)
  slots?: any[];

  @HasMany(() => require("./Reservation").default)
  reservations?: any[];
}
