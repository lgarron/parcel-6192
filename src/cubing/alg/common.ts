import type { Alg } from "./Alg";
import type { IterationDirection } from "./iteration";
import type { LeafUnit, Unit } from "./units/Unit";

// Common to algs or units
export abstract class AlgCommon<T extends Alg | Unit> {
}
