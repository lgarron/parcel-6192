import { experimentalEnsureAlg, FlexibleAlgSource } from "../../Alg";
import { Repetition, RepetitionInfo } from "../Repetition";

export class QuantumCommutator {
}

export class Commutator {
  readonly #repetition: Repetition<QuantumCommutator> = null;

  constructor(
    aSource: FlexibleAlgSource,
    bSource: FlexibleAlgSource,
    repetitionInfo?: RepetitionInfo,
  ) {
    this.#repetition = new Repetition<QuantumCommutator>(
      new QuantumCommutator(
        experimentalEnsureAlg(aSource),
        experimentalEnsureAlg(bSource),
      ), // TODO
      repetitionInfo,
    );
  }

}
