import { Vector3 } from "three";
import { Alg } from "../../cubing/alg";
import { puzzles } from "../../cubing/puzzles";
import {
  TwistyPlayer,
} from "../../cubing/twisty";
import { findOrCreateChild, findOrCreateChildWithClass } from "./dom";
import {
  ALG_INPUT_PLACEHOLDER,
  ALG_SETUP_INPUT_PLACEHOLDER,
  APP_TITLE,
} from "./strings";
import { supportedPuzzles } from "./supported-puzzles";
import { getURLParam, setURLParams } from "./url-params";

console.log(
  Vector3,
  Alg,
  puzzles,
  TwistyPlayer,
  findOrCreateChild,
  findOrCreateChildWithClass,
  ALG_INPUT_PLACEHOLDER,
  ALG_SETUP_INPUT_PLACEHOLDER,
  APP_TITLE,
  supportedPuzzles,
  getURLParam,
  setURLParams,
)

export class App {
}
