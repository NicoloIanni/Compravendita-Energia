import { AllocationStrategy } from "./AllocationStrategy";
import { NoCutStrategy } from "./NoCutStrategy";
import { ProportionalCutStrategy } from "./ProportionalCutStrategy";

// Factory responsabile della selezione della strategy corretta
export class AllocationStrategyFactory {
  static select(
    // Somma totale dei kWh richiesti per lo slot
    totalRequested: number,

    // Capacità massima disponibile nello slot
    capacityKwh: number
  ): AllocationStrategy {

    // Caso 1: richieste <= capacità
    // Non serve alcun taglio → ogni consumer ottiene tutto
    if (totalRequested <= capacityKwh) {
      return new NoCutStrategy();
    }

    // Caso 2: richieste > capacità
    // Oversubscription → applico taglio proporzionale
    return new ProportionalCutStrategy();
  }
}
