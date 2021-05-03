import type { Alg } from "./Alg";
import {
  Commutator,
} from "./units";

export function experimentalIs(
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  v: any,
  c:
    | typeof Alg
    | typeof Commutator
): boolean {
  return v instanceof c;
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function experimentalIsUnit(v: any): boolean {
  return (
    experimentalIs(v, Commutator)
  );
}
