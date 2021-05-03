import {
  Commutator,
} from "./units";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function experimentalIsUnit(v: any): boolean {
  return v instanceof Commutator
}
