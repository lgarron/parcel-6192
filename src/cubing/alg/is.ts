import type { Alg } from "./Alg";
import {
  Commutator,
  Pause,
} from "./units";

export function experimentalIs(
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  v: any,
  c:
    | typeof Alg
    | typeof Commutator
    | typeof Pause,
): boolean {
  return v instanceof c;
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function experimentalIsUnit(v: any): boolean {
  return (
    experimentalIs(v, Commutator) ||
    experimentalIs(v, Pause)
  );
}
