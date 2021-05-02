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

  // TODO:  consider putting a cache in front of this
  public convertString(
    grip: string,
    a: FaceNameSwizzler,
    b: FaceNameSwizzler,
  ): string {
    let suffix = "";
    if ((grip.endsWith("v") || grip.endsWith("v")) && grip <= "_") {
      suffix = grip.slice(grip.length - 1);
      grip = grip.slice(0, grip.length - 1);
    }
    const upper = grip.toUpperCase();
    let isLowerCase = false;
    if (grip !== upper) {
      isLowerCase = true;
      grip = upper;
    }
    grip = b.joinByFaceIndices(a.splitByFaceNames(grip));
    if (isLowerCase) {
      grip = grip.toLowerCase();
    }
    return grip + suffix;
  }

  public convert(move: Move, a: FaceNameSwizzler, b: FaceNameSwizzler): Move {
    const grip = move.family;
    const ngrip = this.convertString(grip, a, b);
    if (grip === ngrip) {
      return move;
    } else {
      return new Move(
        new QuantumMove(ngrip, move.innerLayer, move.outerLayer),
        move.effectiveAmount,
      );
    }
  }

  public notationToInternal(move: Move): Move {
    const r = this.convert(move, this.externalNames, this.internalNames);
    return r;
  }

  public notationToExternal(move: Move): Move {
    return this.convert(move, this.internalNames, this.externalNames);
  }
}
