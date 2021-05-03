
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
      ), // TODO
      repetitionInfo,
    );
  }

}
