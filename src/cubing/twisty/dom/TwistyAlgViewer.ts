import type { Parsed } from "../../alg/parse";
import { puzzles } from "../../puzzles";
import { TwistyPlayer } from "../../twisty";
import { KPuzzleWrapper } from "../3D/puzzles/KPuzzleWrapper";
import { TreeAlgIndexer } from "../animation/indexer/tree/TreeAlgIndexer";

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

  protected connectedCallback(): void {
    // nothing to do?
  }

  private setAlg(alg: Alg): void {
    this.#domTree = algToDOMTree(alg, {
      earliestMoveIndex: 0,
      twistyAlgViewer: this,
      direction: ExperimentalIterationDirection.Forwards,
    }).element;
    this.textContent = "";
    this.appendChild(this.#domTree);
  }

  setTwistyPlayer(twistyPlayer: TwistyPlayer): void {
    if (this.twistyPlayer) {
      console.warn("twisty-player reassignment is not supported");
      return;
    }
    this.twistyPlayer = twistyPlayer;
    const sourceAlg = this.twistyPlayer.alg;
    // TODO: Use proper architecture instead of a heuristic to ensure we have a parsed alg annotated with char indices.
    const parsedAlg =
      "charIndex" in (sourceAlg as Partial<Parsed<Alg>>)
        ? sourceAlg
        : Alg.fromString(sourceAlg.toString());
    this.setAlg(parsedAlg);
    (async () => {
      const wrapper = new KPuzzleWrapper(
        await puzzles[twistyPlayer!.puzzle].def(),
      );
    })();
  }

}

customElements.define(
  "experimental-twisty-alg-viewer",
  ExperimentalTwistyAlgViewer,
);
