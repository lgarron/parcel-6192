/* tslint:disable no-bitwise */
/* tslint:disable prefer-for-of */ // TODO
/* tslint:disable only-arrow-functions */ // TODO
/* tslint:disable typedef */ // TODO

import { Move } from "../alg";

class FaceNameSwizzler {
  public prefixFree: boolean = true;
  public gripnames: string[] = [];
  constructor(public facenames: string[], gripnames_arg?: string[]) {
    if (gripnames_arg) {
      this.gripnames = gripnames_arg;
    }
    for (let i = 0; this.prefixFree && i < facenames.length; i++) {
      for (let j = 0; this.prefixFree && j < facenames.length; j++) {
        if (i !== j && facenames[i].startsWith(facenames[j])) {
          this.prefixFree = false;
        }
      }
    }
  }

}


console.log(FaceNameSwizzler, new Move("R2"))
