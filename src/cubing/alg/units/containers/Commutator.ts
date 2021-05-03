import { experimentalEnsureAlg } from "../../Alg";

class Repetition {
}

export class QuantumCommutator {
}

export class Commutator {
  readonly #repetition: Repetition = null;

  constructor(
  ) {
    this.#repetition = new Repetition(
      new QuantumCommutator(
        experimentalEnsureAlg(aSource),
        experimentalEnsureAlg(bSource),
      ), // TODO
      repetitionInfo,
    );
  }

}
