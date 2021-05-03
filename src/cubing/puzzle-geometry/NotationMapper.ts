import { Move } from "../alg";

export class NullMapper {
}

export class FaceRenamingMapper {
  constructor(
  ) {}

  public convert(): Move {
    return new Move("R2");
  }
}
