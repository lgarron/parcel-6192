import { asyncGetPuzzleGeometry } from "./async/async-pg3d";

export const cube3x3x3 = {
  def: async () => {
    // return await import("./3x3x3.kpuzzle.json");
    return {};
  },
  pg: async () => {
    return asyncGetPuzzleGeometry("3x3x3");
  },
};
