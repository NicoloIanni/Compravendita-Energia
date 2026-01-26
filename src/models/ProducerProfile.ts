import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import type { InferAttributes, InferCreationAttributes } from "sequelize";

// Modello ProducerProfile
// Rappresenta il profilo produttore associato a un User
@Table({ tableName: "ProducerProfiles" })
export default class ProducerProfile extends Model<
  InferAttributes<ProducerProfile>,
  InferCreationAttributes<ProducerProfile>
> {
  // Foreign key verso Users.id
  @ForeignKey(() => require("./User").default)
  @Column(DataType.INTEGER)
  userId!: number;

  // Tipo di energia prodotta dal produttore
  @Column({
    type: DataType.ENUM("Fossile", "Eolico", "Fotovoltaico"),
    allowNull: false,
  })
  energyType!: string;

  // Emissioni di CO2 per kWh prodotto
  // Usato per il calcolo della carbon footprint
  @Column({ type: DataType.FLOAT, allowNull: false, defaultValue: 0 })
  co2_g_per_kwh!: number;

  // Associazione many-to-one verso User
  @BelongsTo(() => require("./User").default)
  user?: any;

  // Associazione one-to-many verso ProducerSlot
  // Un produttore può avere più slot
  @HasMany(() => require("./ProducerSlot").default)
  slots?: any[];

  // Associazione one-to-many verso Reservation
  // Un produttore può ricevere più prenotazioni
  @HasMany(() => require("./Reservation").default)
  reservations?: any[];
}
