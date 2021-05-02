import { ManagedCustomElement } from "./element/ManagedCustomElement";
import { customElementsShim } from "./element/node-custom-element-shims";

// <twisty-player>
export class TwistyPlayer extends ManagedCustomElement {
}

customElementsShim.define("twisty-player", TwistyPlayer);
