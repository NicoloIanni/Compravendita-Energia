// src/strategies/AllocationStrategyFactory.ts

import { AllocationStrategy } from "./AllocationStrategy";
import { NoCutStrategy } from "./NoCutStrategy";
import { ProportionalCutStrategy } from "./ProportionalCutStrategy";

export class AllocationStrategyFactory {
    static select(
        totalRequested: number,
        capacityKwh: number
    ): AllocationStrategy {
        if (totalRequested <= capacityKwh) {
            return new NoCutStrategy();
        }

        return new ProportionalCutStrategy();
    }
}
