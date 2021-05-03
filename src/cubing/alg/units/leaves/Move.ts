import { AlgCommon } from "../../common";
import { IterationDirection } from "../../iteration";
import { parseMove, parseQuantumMove, transferCharIndex } from "../../parse";
import { warnOnce } from "../../warnOnce";
import { Repetition, RepetitionInfo } from "../Repetition";
import type { LeafUnit } from "../Unit";

interface QuantumMoveModifications {
  outerLayer?: number;
  innerLayer?: number;
  family?: string;
}

export class QuantumMove extends Comparable {
  readonly #family: string;
  readonly #innerLayer: number | null;
  readonly #outerLayer: number | null;

  constructor(
    family: string,
    innerLayer?: number | null,
    outerLayer?: number | null,
  ) {
    super();
  }
}

interface MoveModifications {
  outerLayer?: number;
  innerLayer?: number;
  family?: string;
  repetition?: RepetitionInfo;
}

export class Move extends AlgCommon<Move> {
  readonly #repetition: Repetition<QuantumMove>;
}
