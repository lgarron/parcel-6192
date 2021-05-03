// Manages a set of face names.  Detects whether they are prefix-free.
// Implements greedy splitting into face names and comparisons between
// concatenated face names and grip names.

export class FaceNameSwizzler {
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
