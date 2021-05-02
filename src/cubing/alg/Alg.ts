import { AlgCommon, Comparable } from "./common";
import { experimentalIs, experimentalIsUnit } from "./is";

export type FlexibleAlgSource = string | Iterable<Unit> | Alg;

export class Alg extends AlgCommon<Alg> {
  #units: Iterable<Unit>; // TODO: freeze?
  constructor(alg?: FlexibleAlgSource) {
    super();
    console.log(experimentalIsUnit)
  }
}
