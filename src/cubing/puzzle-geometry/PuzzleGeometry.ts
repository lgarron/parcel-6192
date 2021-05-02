/* tslint:disable no-bitwise */
/* tslint:disable prefer-for-of */ // TODO
/* tslint:disable only-arrow-functions */ // TODO
/* tslint:disable typedef */ // TODO

import { Move, QuantumMove } from "../alg";
import { FaceNameSwizzler } from "./FaceNameSwizzler";
import type {
  MoveNotation,
  PGVendoredKPuzzleDefinition,
  Transformation as KTransformation,
} from "./interfaces";
import {
  FaceRenamingMapper,
  FTONotationMapper,
  MegaminxScramblingNotationMapper,
  NotationMapper,
  NullMapper,
  NxNxNCubeMapper,
  PyraminxNotationMapper,
  SkewbNotationMapper,
} from "./NotationMapper";
import { iota, Perm, zeros } from "./Perm";
import {
  Orbit,
  OrbitDef,
  OrbitsDef,
  showcanon,
  Transformation,
  VisibleState,
} from "./PermOriSet";
import { PGPuzzles, PuzzleDescriptionString, PuzzleName } from "./PGPuzzles";
import {
  closure,
  cube,
  dodecahedron,
  getface,
  icosahedron,
  octahedron,
  tetrahedron,
  uniqueplanes,
} from "./PlatonicGenerator";
import { centermassface, expandfaces, FaceTree, Quat } from "./Quat";

const DEFAULT_COLOR_FRACTION = 0.77;

export interface StickerDatSticker {
  coords: number[][];
  color: string;
  orbit: string;
  ord: number;
  ori: number;
}

export interface StickerDatFace {
  coords: number[][];
  name: string;
}

export type StickerDatAxis = [number[], string, number];

export interface StickerDat {
  stickers: StickerDatSticker[];
  foundations: StickerDatSticker[];
  faces: StickerDatFace[];
  axis: StickerDatAxis[];
  unswizzle(mv: Move): string;
  notationMapper: NotationMapper;
}

// TODO: Remove this once we no longer have prefix restrictions.
let NEW_FACE_NAMES = true;
export function useNewFaceNames(use: boolean): void {
  NEW_FACE_NAMES = use;
}

//  Now we have a geometry class that does the 3D goemetry to calculate
//  individual sticker information from a Platonic solid and a set of
//  cuts.  The cuts must have the same symmetry as the Platonic solid;
//  we even restrict them further to be either vertex-normal,
//  edge-normal, or face-parallel cuts.  Right now our constructor takes
//  a character solid indicator (one of c(ube), o(ctahedron), i(cosahedron),
//  t(etradron), or d(odecahedron), followed by an array of cuts.
//  Each cut is a character normal indicator that is either f(ace),
//  e(dge), or v(ertex), followed by a floating point value that gives
//  the depth of the cut where 0 is the center and 1 is the outside
//  border of the shape in that direction.

//  This is a heavyweight class with lots of members and construction
//  is slow.  Be gentle.

//  Everything except a very few methods should be considered private.

const eps: number = 1e-9;
const copyright = "PuzzleGeometry 0.1 Copyright 2018 Tomas Rokicki.";
const permissivieMoveParsing = false;

// This is a description of the nets and the external names we give each
// face.  The names should be a set of prefix-free upper-case alphabetics
// so
// we can easily also name and distinguish vertices and edges, but we
// may change this in the future.  The nets consist of a list of lists.
// Each list gives the name of a face, and then the names of the
// faces connected to that face (in the net) in clockwise order.
// The length of each list should be one more than the number of
// edges in the regular polygon for that face.  All polygons must
// have the same number of edges.
// The first two faces in the first list must describe a horizontal edge
// that is at the bottom of a regular polygon.  The first two faces in
// every subsequent list for a given polytope must describe a edge that
// is directly connected in the net and has already been described (this
// sets the location and orientation of the polygon for that face.
// Any edge that is not directly connected in the net should be given
// the empty string as the other face.  All faces do not need to have
// a list starting with that face; just enough to describe the full
// connectivity of the net.
//
// TODO: change this back to a const JSON definition.
function defaultnets(): any {
  return {
    // four faces: tetrahedron
    4: [["F", "D", "L", "R"]],
    // six faces: cube
    6: [
      ["F", "D", "L", "U", "R"],
      ["R", "F", "", "B", ""],
    ],
    // eight faces: octahedron
    8: [
      ["F", "D", "L", "R"],
      ["D", "F", "BR", ""],
      ["BR", "D", "", "BB"],
      ["BB", "BR", "U", "BL"],
    ],
    // twelve faces:  dodecahedron; U/F/R/F/BL/BR from megaminx
    12: [
      ["U", "F", "", "", "", ""],
      ["F", "U", "R", "C", "A", "L"],
      ["R", "F", "", "", "E", ""],
      ["E", "R", "", "BF", "", ""],
      ["BF", "E", "BR", "BL", "I", "D"],
    ],
    // twenty faces: icosahedron
    20: [
      ["R", "C", "F", "E"],
      ["F", "R", "L", "U"],
      ["L", "F", "A", ""],
      ["E", "R", "G", "I"],
      ["I", "E", "S", "H"],
      ["S", "I", "J", "B"],
      ["B", "S", "K", "D"],
      ["K", "B", "M", "O"],
      ["O", "K", "P", "N"],
      ["P", "O", "Q", ""],
    ],
  };
}

// TODO: change this back to a const JSON definition.
function defaultcolors(): any {
  return {
    // the colors should use the same naming convention as the nets, above.
    4: { F: "#00ff00", D: "#ffff00", L: "#ff0000", R: "#0000ff" },
    6: {
      U: "#ffffff",
      F: "#00ff00",
      R: "#ff0000",
      D: "#ffff00",
      B: "#0000ff",
      L: "#ff8000",
    },
    8: {
      U: "#ffffff",
      F: "#ff0000",
      R: "#00bb00",
      D: "#ffff00",
      BB: "#1122ff",
      L: "#9524c5",
      BL: "#ff8800",
      BR: "#aaaaaa",
    },
    12: {
      U: "#ffffff",
      F: "#006633",
      R: "#ff0000",
      C: "#ffffd0",
      A: "#3399ff",
      L: "#660099",
      E: "#ff66cc",
      BF: "#99ff00",
      BR: "#0000ff",
      BL: "#ffff00",
      I: "#ff6633",
      D: "#999999",
    },
    20: {
      R: "#db69f0",
      C: "#178fde",
      F: "#23238b",
      E: "#9cc726",
      L: "#2c212d",
      U: "#177fa7",
      A: "#e0de7f",
      G: "#2b57c0",
      I: "#41126b",
      S: "#4b8c28",
      H: "#7c098d",
      J: "#7fe7b4",
      B: "#85fb74",
      K: "#3f4bc3",
      D: "#0ff555",
      M: "#f1c2c8",
      O: "#58d340",
      P: "#c514f2",
      N: "#14494e",
      Q: "#8b1be1",
    },
  };
}

// the default precedence of the faces is given here.  This permits
// the orientations to be reasonably predictable.  There are tradeoffs;
// some face precedence orders do better things to the edge orientations
// than the corner orientations and some are the opposite.
// TODO: change this back to a const JSON definition.
function defaultfaceorders(): any {
  return {
    4: ["F", "D", "L", "R"],
    6: ["U", "D", "F", "B", "L", "R"],
    8: ["F", "BB", "D", "U", "BR", "L", "R", "BL"],
    12: ["L", "E", "F", "BF", "R", "I", "U", "D", "BR", "A", "BL", "C"],
    20: [
      "L",
      "S",
      "E",
      "O",
      "F",
      "B",
      "I",
      "P",
      "R",
      "K",
      "U",
      "D",
      "J",
      "A",
      "Q",
      "H",
      "G",
      "N",
      "M",
      "C",
    ],
  };
}

/*
 *  Default orientations for the puzzles in 3D space.  Can be overridden
 *  by puzzleOrientation or puzzleOrientations options.
 *
 *  These are defined to have a strong intuitive vertical (y) direction
 *  since 3D orbital controls need this.  In comments, we list the
 *  preferred initial camera orientation for each puzzle for twizzle;
 *  this information is explicitly given in the twizzle app file.
 */
// TODO: change this back to a const JSON definition.
function defaultOrientations(): any {
  return {
    4: ["FLR", [0, 1, 0], "F", [0, 0, 1]], // FLR towards viewer
    6: ["U", [0, 1, 0], "F", [0, 0, 1]], // URF towards viewer
    8: ["U", [0, 1, 0], "F", [0, 0, 1]], // FLUR towards viewer
    12: ["U", [0, 1, 0], "F", [0, 0, 1]], // F towards viewer
    20: ["GUQMJ", [0, 1, 0], "F", [0, 0, 1]], // F towards viewer
  };
}

function findelement(a: any[], p: Quat): number {
  // find something in facenames, vertexnames, edgenames
  for (let i = 0; i < a.length; i++) {
    if (a[i][0].dist(p) < eps) {
      return i;
    }
  }
  throw new Error("Element not found");
}

export function getpuzzles(): { [s: string]: PuzzleDescriptionString } {
  // get some simple definitions of basic puzzles
  return PGPuzzles;
}

export function getpuzzle(puzzleName: PuzzleName): PuzzleDescriptionString {
  // get some simple definitions of basic puzzles
  return PGPuzzles[puzzleName];
}

export function parsedesc(s: string): any {
  // parse a text description
  const a = s.split(/ /).filter(Boolean);
  if (a.length % 2 === 0) {
    return false;
  }
  if (
    a[0] !== "o" &&
    a[0] !== "c" &&
    a[0] !== "i" &&
    a[0] !== "d" &&
    a[0] !== "t"
  ) {
    return false;
  }
  const r = [];
  for (let i = 1; i < a.length; i += 2) {
    if (a[i] !== "f" && a[i] !== "v" && a[i] !== "e") {
      return false;
    }
    r.push([a[i], a[i + 1]]);
  }
  return [a[0], r];
}

export function getPuzzleGeometryByDesc(
  desc: string,
  options: string[] = [],
): PuzzleGeometry {
  const [shape, cuts] = parsedesc(desc);
  const pg = new PuzzleGeometry(
    shape,
    cuts,
    ["allmoves", "true"].concat(options),
  );
  pg.allstickers();
  pg.genperms();
  return pg;
}

export function getPuzzleGeometryByName(
  puzzleName: PuzzleName,
  options: string[] = [],
): PuzzleGeometry {
  return getPuzzleGeometryByDesc(PGPuzzles[puzzleName], options);
}

function getmovename(geo: any, bits: number[], slices: number): any {
  // generate a move name based on bits, slice, and geo
  // if the move name is from the opposite face, say so.
  // find the face that's turned.
  let inverted = false;
  if (slices - bits[1] < bits[0]) {
    // flip if most of the move is on the other side
    geo = [geo[2], geo[3], geo[0], geo[1]];
    bits = [slices - bits[1], slices - bits[0]];
    inverted = true;
  }
  let movenameFamily = geo[0];
  let movenamePrefix = "";
  if (bits[0] === 0 && bits[1] === slices) {
    movenameFamily = movenameFamily + "v";
  } else if (bits[0] === bits[1]) {
    if (bits[1] > 0) {
      movenamePrefix = String(bits[1] + 1);
    }
  } else if (bits[0] === 0) {
    movenameFamily = movenameFamily.toLowerCase();
    if (bits[1] > 1) {
      movenamePrefix = String(bits[1] + 1);
    }
  } else {
    throw "We only support slice and outer block moves right now. " + bits;
  }
  return [movenamePrefix + movenameFamily, inverted];
}

// split a geometrical element into face names.  Do greedy match.
// Permit underscores between names.
function splitByFaceNames(s: string, facenames: any[]): string[] {
  const r: string[] = [];
  let at = 0;
  while (at < s.length) {
    if (at > 0 && at < s.length && s[at] === "_") {
      at++;
    }
    let currentMatch = "";
    for (let i = 0; i < facenames.length; i++) {
      if (
        s.substr(at).startsWith(facenames[i][1]) &&
        facenames[i][1].length > currentMatch.length
      ) {
        currentMatch = facenames[i][1];
      }
    }
    if (currentMatch !== "") {
      r.push(currentMatch);
      at += currentMatch.length;
    } else {
      throw new Error("Could not split " + s + " into face names.");
    }
  }
  return r;
}

function toCoords(q: Quat, maxdist: number): number[] {
  return [q.b / maxdist, -q.c / maxdist, q.d / maxdist];
}

function toFaceCoords(q: Quat[], maxdist: number): number[][] {
  const r = [];
  const n = q.length;
  for (let i = 0; i < n; i++) {
    r[n - i - 1] = toCoords(q[i], maxdist);
  }
  return r;
}

function trimEdges(face: Quat[], tr: number): Quat[] {
  const r: Quat[] = [];
  for (let iter = 1; iter < 10; iter++) {
    for (let i = 0; i < face.length; i++) {
      const pi = (i + face.length - 1) % face.length;
      const ni = (i + 1) % face.length;
      const A = face[pi].sub(face[i]).normalize();
      const B = face[ni].sub(face[i]).normalize();
      const d = A.dot(B);
      const m = tr / Math.sqrt(1 - d * d);
      r[i] = face[i].sum(A.sum(B).smul(m));
    }
    let good = true;
    for (let i = 0; good && i < r.length; i++) {
      const pi = (i + face.length - 1) % face.length;
      const ni = (i + 1) % face.length;
      if (r[pi].sub(r[i]).cross(r[ni].sub(r[i])).dot(r[i]) >= 0) {
        good = false;
      }
    }
    if (good) {
      return r;
    }
    tr /= 2;
  }
  return face;
}

export class PuzzleGeometry {
  public args: string = "";
  public rotations: Quat[]; // all members of the rotation group
  public baseplanerot: Quat[]; // unique rotations of the baseplane
  public baseplanes: Quat[]; // planes, corresponding to faces
  public facenames: any[]; // face names
  public faceplanes: any; // face planes
  public edgenames: any[]; // edge names
  public vertexnames: any[]; // vertexnames
  public geonormals: any[]; // all geometric directions, with names and types
  public moveplanes: Quat[]; // the planes that split moves
  public moveplanes2: Quat[]; // the planes that split moves, filtered
  public moveplanesets: any[]; // the move planes, in parallel sets
  public moveplanenormals: Quat[]; // one move plane
  public movesetorders: any[]; // the order of rotations for each move set
  public movesetgeos: any[]; // geometric feature information for move sets
  public basefaces: Quat[][]; // polytope faces before cuts
  public faces: Quat[][]; // all the stickers
  public facecentermass: Quat[]; // center of mass of all faces
  public basefacecount: number; // number of base faces
  public stickersperface: number; // number of stickers per face
  public cornerfaces: number; // number of faces that meet at a corner
  public cubies: any[]; // the cubies
  public shortedge: number; // shortest edge
  public vertexdistance: number; // vertex distance
  public edgedistance: number; // edge distance
  public orbits: number; // count of cubie orbits
  public facetocubies: any[]; // map a face to a cubie index and offset
  public moverotations: Quat[][]; // move rotations
  public cubiekey: any; // cubie locator
  public cubiekeys: string[]; // cubie keys
  public facelisthash: any; // face list by key
  public cubiesetnames: any[]; // cubie set names
  public cubieords: number[]; // the size of each orbit
  public cubiesetnums: number[];
  public cubieordnums: number[];
  public orbitoris: number[]; // the orientation size of each orbit
  public cubievaluemap: number[]; // the map for identical cubies
  public cubiesetcubies: number[][]; // cubies in each cubie set
  public cmovesbyslice: number[][][] = []; // cmoves as perms by slice
  // options
  public verbose: number = 0; // verbosity (console.log)
  public allmoves: boolean = false; // generate all slice moves in ksolve
  public outerblockmoves: boolean; // generate outer block moves
  public vertexmoves: boolean; // generate vertex moves
  public addrotations: boolean; // add symmetry information to ksolve output
  public movelist: any; // move list to generate
  public parsedmovelist: any; // parsed move list
  public puzzleOrientation: any; // single puzzle orientation from options
  public puzzleOrientations: any; // puzzle orientation override list from options
  public cornersets: boolean = true; // include corner sets
  public centersets: boolean = true; // include center sets
  public edgesets: boolean = true; // include edge sets
  public graycorners: boolean = false; // make corner sets gray
  public graycenters: boolean = false; // make center sets gray
  public grayedges: boolean = false; // make edge sets gray
  public killorientation: boolean = false; // eliminate any orientations
  public optimize: boolean = false; // optimize PermOri
  public scramble: number = 0; // scramble?
  public ksolvemovenames: string[]; // move names from ksolve
  public fixPiece: string = ""; // fix a piece?
  public orientCenters: boolean = false; // orient centers?
  public duplicatedFaces: number[] = []; // which faces are duplicated
  public duplicatedCubies: number[] = []; // which cubies are duplicated
  public fixedCubie: number = -1; // fixed cubie, if any
  public svggrips: any[]; // grips from svg generation by svg coordinate
  public net: any = [];
  public colors: any = [];
  public faceorder: any = [];
  public faceprecedence: number[] = [];
  public swizzler: FaceNameSwizzler;
  public notationMapper: NotationMapper = new NullMapper();
  public addNotationMapper: string = "";
  public setReidOrder: boolean = false;
  constructor(shape: string, cuts: string[][], optionlist: any[] | undefined) {
    function asstructured(v: any): any {
      if (typeof v === "string") {
        return JSON.parse(v);
      }
      return v;
    }
    function asboolean(v: any): boolean {
      if (typeof v === "string") {
        if (v === "false") {
          return false;
        }
        return true;
      } else {
        return v ? true : false;
      }
    }
    if (optionlist !== undefined) {
      if (optionlist.length % 2 !== 0) {
        throw new Error("Odd length in option list?");
      }
      for (let i = 0; i < optionlist.length; i += 2) {
        if (optionlist[i] === "verbose") {
          this.verbose++;
        } else if (optionlist[i] === "quiet") {
          this.verbose = 0;
        } else if (optionlist[i] === "allmoves") {
          this.allmoves = asboolean(optionlist[i + 1]);
        } else if (optionlist[i] === "outerblockmoves") {
          this.outerblockmoves = asboolean(optionlist[i + 1]);
        } else if (optionlist[i] === "vertexmoves") {
          this.vertexmoves = asboolean(optionlist[i + 1]);
        } else if (optionlist[i] === "rotations") {
          this.addrotations = asboolean(optionlist[i + 1]);
        } else if (optionlist[i] === "cornersets") {
          this.cornersets = asboolean(optionlist[i + 1]);
        } else if (optionlist[i] === "centersets") {
          this.centersets = asboolean(optionlist[i + 1]);
        } else if (optionlist[i] === "edgesets") {
          this.edgesets = asboolean(optionlist[i + 1]);
        } else if (optionlist[i] === "graycorners") {
          this.graycorners = asboolean(optionlist[i + 1]);
        } else if (optionlist[i] === "graycenters") {
          this.graycenters = asboolean(optionlist[i + 1]);
        } else if (optionlist[i] === "grayedges") {
          this.grayedges = asboolean(optionlist[i + 1]);
        } else if (optionlist[i] === "movelist") {
          this.movelist = asstructured(optionlist[i + 1]);
        } else if (optionlist[i] === "killorientation") {
          this.killorientation = asboolean(optionlist[i + 1]);
        } else if (optionlist[i] === "optimize") {
          this.optimize = asboolean(optionlist[i + 1]);
        } else if (optionlist[i] === "scramble") {
          this.scramble = optionlist[i + 1];
        } else if (optionlist[i] === "fix") {
          this.fixPiece = optionlist[i + 1];
        } else if (optionlist[i] === "orientcenters") {
          this.orientCenters = asboolean(optionlist[i + 1]);
        } else if (optionlist[i] === "puzzleorientation") {
          this.puzzleOrientation = asstructured(optionlist[i + 1]);
        } else if (optionlist[i] === "puzzleorientations") {
          this.puzzleOrientations = asstructured(optionlist[i + 1]);
        } else {
          throw new Error(
            "Bad option while processing option list " + optionlist[i],
          );
        }
      }
    }
    this.args = shape + " " + cuts.map((_) => _.join(" ")).join(" ");
    if (optionlist) {
      this.args += " " + optionlist.join(" ");
    }
    if (this.verbose > 0) {
      console.log(this.header("# "));
    }
    this.create(shape, cuts);
  }
}
