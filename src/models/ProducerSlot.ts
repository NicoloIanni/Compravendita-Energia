import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import type { InferAttributes, InferCreationAttributes } from "sequelize";

// Modello ProducerSlot
// Rappresenta uno slot orario (1h) messo a disposizione da un produttore
@Table({
  tableName: "ProducerSlots",
  indexes: [
    {
      // Vincolo UNIQUE composito
      // Garantisce che un produttore non possa avere
      // due slot per la stessa data e ora
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
  // Foreign key verso ProducerProfiles.id
  @ForeignKey(() => require("./ProducerProfile").default)
  @Column(DataType.INTEGER)
  producerProfileId!: number;

  // Data dello slot (YYYY-MM-DD)
  @Column({ type: DataType.STRING, allowNull: false })
  date!: string;

  // Ora dello slot (0–23)
  @Column({ type: DataType.INTEGER, allowNull: false })
  hour!: number;

  // Capacità massima erogabile nello slot (kWh)
  @Column({ type: DataType.FLOAT, allowNull: false })
  capacityKwh!: number;

  // Prezzo per kWh nello slot
  @Column({ type: DataType.FLOAT, allowNull: false })
  pricePerKwh!: number;

  // === soft-delete flags ===
  // Indica se lo slot è stato disattivato logicamente
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  deleted!: boolean;

  // Timestamp della soft delete
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  deletedAt!: Date | null;

  // Associazione many-to-one verso ProducerProfile
  @BelongsTo(() => require("./ProducerProfile").default)
  producerProfile?: any;
}
