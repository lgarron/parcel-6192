import { puzzles } from "../puzzles";

(async () => {
  await puzzles["3x3x3"].def()
})();

export { TwistyPlayer } from "./dom/TwistyPlayer";
