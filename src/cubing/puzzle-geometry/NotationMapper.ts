import type { FaceNameSwizzler } from "./FaceNameSwizzler";
import { Move, QuantumMove } from "../alg";

export interface NotationMapper {
  notationToInternal(move: Move): Move | null;
  notationToExternal(move: Move): Move | null;
}

export class NullMapper implements NotationMapper {
  public notationToInternal(move: Move): Move {
    return move;
  }

  public notationToExternal(move: Move): Move {
    return move;
  }
}

export class FaceRenamingMapper implements NotationMapper {
  constructor(
    public internalNames: FaceNameSwizzler,
    public externalNames: FaceNameSwizzler,
  ) {}

  public convert(): Move {
    return new Move(
        new QuantumMove("R"),
        2,
      );
  }
}
