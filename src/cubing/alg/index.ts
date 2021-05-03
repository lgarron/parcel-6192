
export class Move {
}


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

console.log(Commutator)

export class Alg {
}


import "./bulky-code"
