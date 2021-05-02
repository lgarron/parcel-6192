import { customElementsShim } from "./element/node-custom-element-shims";

// <twisty-player>
export class TwistyPlayer extends HTMLElement {
}

customElementsShim.define("twisty-player", TwistyPlayer);
