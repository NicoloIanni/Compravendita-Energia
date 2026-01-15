import {
  Table,
  Model,
  Column,
  DataType,
  HasOne,
  HasMany,
} from "sequelize-typescript";

@Table({ tableName: "Users" })
export default class User extends Model<User> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  email!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  passwordHash!: string;

  @Column({
    type: DataType.ENUM("admin", "producer", "consumer"),
    allowNull: false,
  })
  role!: string;

  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
  credit!: number;

  @HasOne(() => require("./ProducerProfile").default)
  producerProfile?: any;

  @HasMany(() => require("./Reservation").default)
  reservations?: any[];

}
