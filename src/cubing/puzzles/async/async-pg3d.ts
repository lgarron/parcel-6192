import type { PuzzleGeometry } from "../../puzzle-geometry";

// TODO: modify this to handle TwistyPlayer options
export async function asyncGetPuzzleGeometry(
  puzzleName: string,
): Promise<PuzzleGeometry> {
  const puzzleGeometry = await import("../../puzzle-geometry");
  return puzzleGeometry.getPuzzleGeometryByName(puzzleName, [
    "allmoves",
    "true",
    "orientcenters",
    "true",
    "rotations",
    "true",
  ]);
}
