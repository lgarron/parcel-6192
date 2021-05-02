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
      const indexer = new TreeAlgIndexer(wrapper, parsedAlg);
      twistyPlayer.timeline.addTimestampListener({
        onTimelineTimestampChange: (timestamp: MillisecondTimestamp): void => {
          // TODO: improve perf, e.g. only get notified when the move index changes.
          this.highlighter.set(
            indexer.getMove(
              indexer.timestampToIndex(timestamp),
            ) as Parsed<Move> | null,
          );
        },
        onTimeRangeChange(_timeRange: TimeRange): void {},
      });
    })();
    twistyPlayer.timeline.addTimestampListener({
      onTimelineTimestampChange: (timestamp: MillisecondTimestamp) => {
        if (timestamp !== this.lastClickTimestamp) {
          this.lastClickTimestamp = null;
        }
        const index =
          this.twistyPlayer?.cursor?.experimentalIndexFromTimestamp(
            timestamp,
          ) ?? null;
        if (index !== null) {
          // console.log(index);
          // console.log(this.#domTree.pathToIndex(index));
        }
      },
      onTimeRangeChange: (_timeRange: TimeRange) => {
        // TODO
      },
    });
  }

  jumpToIndex(index: number, offsetIntoMove: boolean): void {
    if (this.twistyPlayer && this.twistyPlayer.cursor) {
      const offset = offsetIntoMove ? DEFAULT_OFFSET_MS : 0;
      const timestamp =
        (this.twistyPlayer.cursor.experimentalTimestampFromIndex(index) ??
          -offset) + offset;
      this.twistyPlayer?.timeline.setTimestamp(timestamp);
      if (this.lastClickTimestamp === timestamp) {
        this.twistyPlayer.timeline.play();
        this.lastClickTimestamp = null;
      } else {
        this.lastClickTimestamp = timestamp;
      }
    }
  }

  protected attributeChangedCallback(
    attributeName: string,
    _oldValue: string,
    newValue: string,
  ): void {
    if (attributeName === "for") {
      const elem = document.getElementById(newValue);
      if (!elem) {
        console.warn("for= elem does not exist");
        return;
      }
      if (!(elem instanceof TwistyPlayer)) {
        console.warn("for= elem is not a twisty-player");
        return;
      }
      this.setTwistyPlayer(elem);
    }
  }

  static get observedAttributes(): string[] {
    return ["for"];
  }
}

customElements.define(
  "experimental-twisty-alg-viewer",
  ExperimentalTwistyAlgViewer,
);
