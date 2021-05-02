import type { ExperimentalStickering } from "../../../twisty";
import { asyncGetPuzzleGeometry } from "../../async/async-pg3d";
import type { PuzzleLoader } from "../../PuzzleLoader";
import type { PuzzleAppearance } from "../../stickerings/appearance";
import {
  cubeAppearance,
  cubeStickerings,
} from "../../stickerings/cube-stickerings";

// Include 3x3x3 in the main bundle for better performance.
import { cube3x3x3KPuzzle } from "./3x3x3.kpuzzle.json_";

export const cube3x3x3: PuzzleLoader = {
  id: "3x3x3",
  fullName: "3×3×3 Cube",
  inventedBy: ["Ernő Rubik"],
  inventionYear: 1974, // https://en.wikipedia.org/wiki/Rubik%27s_Cube#Conception_and_development
  def: async () => {
    // return await import("./3x3x3.kpuzzle.json");
    return cube3x3x3KPuzzle;
  },
  pg: async () => {
    return asyncGetPuzzleGeometry("3x3x3");
  },
  appearance: (stickering: ExperimentalStickering): Promise<PuzzleAppearance> =>
    cubeAppearance(cube3x3x3, stickering),
  stickerings: cubeStickerings,
};
