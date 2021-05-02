import { asyncGetPuzzleGeometry } from "../../async/async-pg3d";
import type { PuzzleLoader } from "../../PuzzleLoader";
// Include 3x3x3 in the main bundle for better performance.
import { cube3x3x3KPuzzle } from "./3x3x3.kpuzzle.json_";


export const cube3x3x3: PuzzleLoader = {
  def: async () => {
    // return await import("./3x3x3.kpuzzle.json");
    return cube3x3x3KPuzzle;
  },
  pg: async () => {
    return asyncGetPuzzleGeometry("3x3x3");
  },
};
