import { InferAttributes } from "sequelize";
import {
  Table,
  Model,
  Column,
  DataType,
  HasOne,
  HasMany,
} from "sequelize-typescript";

// Modello User
// Rappresenta l'utente autenticato del sistema
@Table({ tableName: "Users" })
export default class User extends Model<
  InferAttributes<User>,
  InferAttributes<User>
> {
  // Email dell'utente (usata per il login)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  email!: string;

  // Hash della password (mai in chiaro)
  @Column({ type: DataType.STRING, allowNull: false })
  passwordHash!: string;

  // Ruolo dell'utente:
  // admin | producer | consumer
  @Column({
    type: DataType.ENUM("admin", "producer", "consumer"),
    allowNull: false,
  })
  role!: string;

  // Credito/token disponibile (usato dai consumer)
  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
  credit!: number;

  // Associazione one-to-one con ProducerProfile
  // Presente solo se l'utente è producer
  @HasOne(() => require("./ProducerProfile").default)
  producerProfile?: any;

  // Associazione one-to-many con Reservation
  // Un utente consumer può avere più prenotazioni
  @HasMany(() => require("./Reservation").default)
  reservations?: any[];
}
