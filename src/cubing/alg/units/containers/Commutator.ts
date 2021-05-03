import { experimentalEnsureAlg } from "../../Alg";
import { Repetition } from "../Repetition";

export class QuantumCommutator {
}

export class Commutator {
  readonly #repetition: Repetition<QuantumCommutator> = null;

  constructor(
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
