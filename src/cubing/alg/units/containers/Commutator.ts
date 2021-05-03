import { Alg, experimentalEnsureAlg, FlexibleAlgSource } from "../../Alg";
import { AlgCommon, Comparable } from "../../common";
import { IterationDirection } from "../../iteration";
import { Repetition, RepetitionInfo } from "../Repetition";
import type { LeafUnit } from "../Unit";

export class QuantumCommutator extends Comparable {
}

export class Commutator extends AlgCommon<Commutator> {
  readonly #repetition: Repetition<QuantumCommutator> = null;

  constructor(
    aSource: FlexibleAlgSource,
    bSource: FlexibleAlgSource,
    repetitionInfo?: RepetitionInfo,
  ) {
    super();
    this.#repetition = new Repetition<QuantumCommutator>(
      new QuantumCommutator(
        experimentalEnsureAlg(aSource),
        experimentalEnsureAlg(bSource),
      ), // TODO
      repetitionInfo,
    );
  }

}
