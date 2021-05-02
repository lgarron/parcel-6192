import type { Parsed } from "../../alg/parse";
import { puzzles } from "../../puzzles";
import { TwistyPlayer } from "../../twisty";

export class ExperimentalTwistyAlgViewer extends HTMLElement {
  highlighter: MoveHighlighter = new MoveHighlighter();
  #domTree: TwistyAlgWrapperElem | TwistyAlgLeafElem;
  twistyPlayer: TwistyPlayer | null = null;
  lastClickTimestamp: number | null = null;
  constructor(options?: { twistyPlayer?: TwistyPlayer }) {
    super();
    if (options?.twistyPlayer) {
      this.setTwistyPlayer(options?.twistyPlayer);
    }
  }

}

customElements.define(
  "experimental-twisty-alg-viewer",
  ExperimentalTwistyAlgViewer,
);
