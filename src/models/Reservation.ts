import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import type { InferAttributes, InferCreationAttributes } from "sequelize";

// Modello Reservation
// Rappresenta una prenotazione di energia effettuata da un consumer
// verso uno slot di un produttore
@Table({ tableName: "Reservations" })
export default class Reservation extends Model<
  InferAttributes<Reservation>,
  InferCreationAttributes<Reservation>
> {
  // Foreign key verso Users.id
  // Identifica il consumer che effettua la prenotazione
  @ForeignKey(() => require("./User").default)
  @Column(DataType.INTEGER)
  consumerId!: number;

  // Foreign key verso ProducerProfiles.id
  // Identifica il produttore presso cui viene effettuata la prenotazione
  @ForeignKey(() => require("./ProducerProfile").default)
  @Column(DataType.INTEGER)
  producerProfileId!: number;

  // Data dello slot prenotato (YYYY-MM-DD)
  @Column({ type: DataType.STRING, allowNull: false })
  date!: string;

  // Ora dello slot prenotato (valori attesi: 0–23)
  @Column({ type: DataType.INTEGER, allowNull: false })
  hour!: number;

  // Quantità di energia richiesta dal consumer (kWh)
  @Column({ type: DataType.FLOAT, allowNull: false })
  requestedKwh!: number;

  // Quantità di energia effettivamente allocata dopo la risoluzione
  @Column({ type: DataType.FLOAT, allowNull: false })
  allocatedKwh!: number;

  // Stato della prenotazione:
  // PENDING   -> creata ma non ancora risolta
  // ALLOCATED -> risolta e allocata
  // CANCELLED -> annullata dal consumer
  @Column({
    type: DataType.ENUM("PENDING", "ALLOCATED", "CANCELLED"),
    allowNull: false,
  })
  status!: string;

  // Costo totale addebitato al consumer
  // Può essere aggiornato in caso di taglio proporzionale o cancellazione
  @Column({ type: DataType.FLOAT, allowNull: false })
  totalCostCharged!: number;

  // Associazione many-to-one verso User (consumer)
  @BelongsTo(() => require("./User").default, "consumerId")
  consumer?: any;

  // Associazione many-to-one verso ProducerProfile (produttore)
  @BelongsTo(() => require("./ProducerProfile").default, "producerProfileId")
  producerProfile?: any;
}
