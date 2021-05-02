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

  public create(shape: string, cuts: any[]): void {
    // create the shape, doing all the essential geometry
    // create only goes far enough to figure out how many stickers per
    // face, and what the short edge is.  If the short edge is too short,
    // we probably don't want to display or manipulate this one.  How
    // short is too short is hard to say.
    // var that = this ; // TODO
    this.moveplanes = [];
    this.moveplanes2 = [];
    this.faces = [];
    this.cubies = [];
    let g = null;
    switch (shape) {
      case "c":
        g = cube();
        break;
      case "o":
        g = octahedron();
        break;
      case "i":
        g = icosahedron();
        break;
      case "t":
        g = tetrahedron();
        break;
      case "d":
        g = dodecahedron();
        break;
      default:
        throw new Error("Bad shape argument: " + shape);
    }
    this.rotations = closure(g);
    if (this.verbose) {
      console.log("# Rotations: " + this.rotations.length);
    }
    const baseplane = g[0];
    this.baseplanerot = uniqueplanes(baseplane, this.rotations);
    const baseplanes = this.baseplanerot.map((_) => baseplane.rotateplane(_));
    this.baseplanes = baseplanes;
    this.basefacecount = baseplanes.length;
    const net = defaultnets()[baseplanes.length];
    this.net = net;
    this.colors = defaultcolors()[baseplanes.length];
    this.faceorder = defaultfaceorders()[baseplanes.length];
    if (this.verbose) {
      console.log("# Base planes: " + baseplanes.length);
    }
    const baseface = getface(baseplanes);
    const zero = new Quat(0, 0, 0, 0);
    if (this.verbose) {
      console.log("# Face vertices: " + baseface.length);
    }
    const facenormal = baseplanes[0].makenormal();
    const edgenormal = baseface[0].sum(baseface[1]).makenormal();
    const vertexnormal = baseface[0].makenormal();
    const boundary = new Quat(1, facenormal.b, facenormal.c, facenormal.d);
    if (this.verbose) {
      console.log("# Boundary is " + boundary);
    }
    const planerot = uniqueplanes(boundary, this.rotations);
    const planes = planerot.map((_) => boundary.rotateplane(_));
    let faces = [getface(planes)];
    this.edgedistance = faces[0][0].sum(faces[0][1]).smul(0.5).dist(zero);
    this.vertexdistance = faces[0][0].dist(zero);
    const cutplanes = [];
    const intersects = [];
    let sawface = false; // what cuts did we see?
    let sawedge = false;
    let sawvertex = false;
    for (let i = 0; i < cuts.length; i++) {
      let normal = null;
      let distance = 0;
      switch (cuts[i][0]) {
        case "f":
          normal = facenormal;
          distance = 1;
          sawface = true;
          break;
        case "v":
          normal = vertexnormal;
          distance = this.vertexdistance;
          sawvertex = true;
          break;
        case "e":
          normal = edgenormal;
          distance = this.edgedistance;
          sawedge = true;
          break;
        default:
          throw new Error("Bad cut argument: " + cuts[i][0]);
      }
      cutplanes.push(normal.makecut(Number(cuts[i][1])));
      intersects.push(cuts[i][1] < distance);
    }
    if (this.addrotations) {
      if (!sawface) {
        cutplanes.push(facenormal.makecut(10));
      }
      if (!sawvertex) {
        cutplanes.push(vertexnormal.makecut(10));
      }
      if (!sawedge) {
        cutplanes.push(edgenormal.makecut(10));
      }
    }
    this.basefaces = [];
    for (let i = 0; i < this.baseplanerot.length; i++) {
      const face = this.baseplanerot[i].rotateface(faces[0]);
      this.basefaces.push(face);
    }
    //
    //   Determine names for edges, vertices, and planes.  Planes are defined
    //   by the plane normal/distance; edges are defined by the midpoint;
    //   vertices are defined by actual point.  In each case we define a name.
    //   Note that edges have two potential names, and corners have n where
    //   n planes meet at a vertex.  We arbitrarily choose the one that is
    //   alphabetically first (and we will probably want to change this).
    //
    const facenames: any[] = [];
    const faceplanes = [];
    const vertexnames: any[] = [];
    const edgenames: any[] = [];
    const edgesperface = faces[0].length;
    function searchaddelement(a: any[], p: Quat, name: any): void {
      for (let i = 0; i < a.length; i++) {
        if (a[i][0].dist(p) < eps) {
          a[i].push(name);
          return;
        }
      }
      a.push([p, name]);
    }
    for (let i = 0; i < this.baseplanerot.length; i++) {
      const face = this.baseplanerot[i].rotateface(faces[0]);
      for (let j = 0; j < face.length; j++) {
        const jj = (j + 1) % face.length;
        const midpoint = face[j].sum(face[jj]).smul(0.5);
        searchaddelement(edgenames, midpoint, i);
      }
    }
    const otherfaces = [];
    for (let i = 0; i < this.baseplanerot.length; i++) {
      const face = this.baseplanerot[i].rotateface(faces[0]);
      const facelist = [];
      for (let j = 0; j < face.length; j++) {
        const jj = (j + 1) % face.length;
        const midpoint = face[j].sum(face[jj]).smul(0.5);
        const el = edgenames[findelement(edgenames, midpoint)];
        if (i === el[1]) {
          facelist.push(el[2]);
        } else if (i === el[2]) {
          facelist.push(el[1]);
        } else {
          throw new Error("Could not find edge");
        }
      }
      otherfaces.push(facelist);
    }
    const facenametoindex: any = {};
    const faceindextoname: any = [];
    faceindextoname.push(net[0][0]);
    facenametoindex[net[0][0]] = 0;
    faceindextoname[otherfaces[0][0]] = net[0][1];
    facenametoindex[net[0][1]] = otherfaces[0][0];
    for (let i = 0; i < net.length; i++) {
      const f0 = net[i][0];
      const fi = facenametoindex[f0];
      if (fi === undefined) {
        throw new Error("Bad edge description; first edge not connected");
      }
      let ii = -1;
      for (let j = 0; j < otherfaces[fi].length; j++) {
        const fn2 = faceindextoname[otherfaces[fi][j]];
        if (fn2 !== undefined && fn2 === net[i][1]) {
          ii = j;
          break;
        }
      }
      if (ii < 0) {
        throw new Error("First element of a net not known");
      }
      for (let j = 2; j < net[i].length; j++) {
        if (net[i][j] === "") {
          continue;
        }
        const of = otherfaces[fi][(j + ii - 1) % edgesperface];
        const fn2 = faceindextoname[of];
        if (fn2 !== undefined && fn2 !== net[i][j]) {
          throw new Error("Face mismatch in net");
        }
        faceindextoname[of] = net[i][j];
        facenametoindex[net[i][j]] = of;
      }
    }
    for (let i = 0; i < faceindextoname.length; i++) {
      let found = false;
      for (let j = 0; j < this.faceorder.length; j++) {
        if (faceindextoname[i] === this.faceorder[j]) {
          this.faceprecedence[i] = j;
          found = true;
          break;
        }
      }
      if (!found) {
        throw new Error(
          "Could not find face " +
            faceindextoname[i] +
            " in face order list " +
            this.faceorder,
        );
      }
    }
    for (let i = 0; i < this.baseplanerot.length; i++) {
      const face = this.baseplanerot[i].rotateface(faces[0]);
      const faceplane = boundary.rotateplane(this.baseplanerot[i]);
      const facename = faceindextoname[i];
      facenames.push([face, facename]);
      faceplanes.push([faceplane, facename]);
    }
    for (let i = 0; i < this.baseplanerot.length; i++) {
      const face = this.baseplanerot[i].rotateface(faces[0]);
      const facename = faceindextoname[i];
      for (let j = 0; j < face.length; j++) {
        const jj = (j + 1) % face.length;
        const midpoint = face[j].sum(face[jj]).smul(0.5);
        const jjj = (j + 2) % face.length;
        const midpoint2 = face[jj].sum(face[jjj]).smul(0.5);
        const e1 = findelement(edgenames, midpoint);
        const e2 = findelement(edgenames, midpoint2);
        searchaddelement(vertexnames, face[jj], [facename, e2, e1]);
      }
    }
    this.swizzler = new FaceNameSwizzler(facenames.map((_: any) => _[1]));
    const sep = this.swizzler.prefixFree ? "" : "_";
    // fix the edge names; use face precedence order
    for (let i = 0; i < edgenames.length; i++) {
      if (edgenames[i].length !== 3) {
        throw new Error("Bad length in edge names " + edgenames[i]);
      }
      let c1 = faceindextoname[edgenames[i][1]];
      const c2 = faceindextoname[edgenames[i][2]];
      if (
        this.faceprecedence[edgenames[i][1]] <
        this.faceprecedence[edgenames[i][2]]
      ) {
        c1 = c1 + sep + c2;
      } else {
        c1 = c2 + sep + c1;
      }
      edgenames[i] = [edgenames[i][0], c1];
    }
    // fix the vertex names; counterclockwise rotations; low face first.
    this.cornerfaces = vertexnames[0].length - 1;
    for (let i = 0; i < vertexnames.length; i++) {
      if (vertexnames[i].length < 4) {
        throw new Error("Bad length in vertex names");
      }
      let st = 1;
      for (let j = 2; j < vertexnames[i].length; j++) {
        if (
          this.faceprecedence[facenametoindex[vertexnames[i][j][0]]] <
          this.faceprecedence[facenametoindex[vertexnames[i][st][0]]]
        ) {
          st = j;
        }
      }
      let r = "";
      for (let j = 1; j < vertexnames[i].length; j++) {
        if (j === 1) {
          r = vertexnames[i][st][0];
        } else {
          r = r + sep + vertexnames[i][st][0];
        }
        for (let k = 1; k < vertexnames[i].length; k++) {
          if (vertexnames[i][st][1] === vertexnames[i][k][2]) {
            st = k;
            break;
          }
        }
      }
      vertexnames[i] = [vertexnames[i][0], r];
    }
    if (this.verbose > 1) {
      console.log("# Face precedence list: " + this.faceorder.join(" "));
      console.log("# Face names: " + facenames.map((_: any) => _[1]).join(" "));
      console.log("# Edge names: " + edgenames.map((_: any) => _[1]).join(" "));
      console.log(
        "# Vertex names: " + vertexnames.map((_: any) => _[1]).join(" "),
      );
    }
    const geonormals = [];
    for (let i = 0; i < faceplanes.length; i++) {
      geonormals.push([faceplanes[i][0].makenormal(), faceplanes[i][1], "f"]);
    }
    for (let i = 0; i < edgenames.length; i++) {
      geonormals.push([edgenames[i][0].makenormal(), edgenames[i][1], "e"]);
    }
    for (let i = 0; i < vertexnames.length; i++) {
      geonormals.push([vertexnames[i][0].makenormal(), vertexnames[i][1], "v"]);
    }
    this.facenames = facenames;
    this.faceplanes = faceplanes;
    this.edgenames = edgenames;
    this.vertexnames = vertexnames;
    this.geonormals = geonormals;
    const geonormalnames = geonormals.map((_: any) => _[1]);
    this.swizzler.setGripNames(geonormalnames);
    if (this.verbose) {
      console.log(
        "# Distances: face " +
          1 +
          " edge " +
          this.edgedistance +
          " vertex " +
          this.vertexdistance,
      );
    }
    // expand cutplanes by rotations.  We only work with one face here.
    for (let c = 0; c < cutplanes.length; c++) {
      for (let i = 0; i < this.rotations.length; i++) {
        const q = cutplanes[c].rotateplane(this.rotations[i]);
        let wasseen = false;
        for (let j = 0; j < this.moveplanes.length; j++) {
          if (q.sameplane(this.moveplanes[j])) {
            wasseen = true;
            break;
          }
        }
        if (!wasseen) {
          this.moveplanes.push(q);
          if (intersects[c]) {
            this.moveplanes2.push(q);
          }
        }
      }
    }
    let ft = new FaceTree(faces[0]);
    const tar = this.moveplanes2.slice();
    // we want to use Math.random() here but we can't, because when
    // we call multiple times we'll get different orbits/layouts.
    // to resolve this, we use a very simple linear congruential
    // generator.  for our purposes, the numbers don't need to be
    // very random.
    let rval = 31;
    for (let i = 0; i < tar.length; i++) {
      const j = i + Math.floor((tar.length - i) * (rval / 65536.0));
      ft = ft.split(tar[j]);
      tar[j] = tar[i];
      rval = (rval * 1657 + 101) % 65536;
    }
    faces = ft.collect([], true);
    this.faces = faces;
    if (this.verbose) {
      console.log("# Faces is now " + faces.length);
    }
    this.stickersperface = faces.length;
    //  Find and report the shortest edge in any of the faces.  If this
    //  is small the puzzle is probably not practical or displayable.
    let shortedge = 1e99;
    for (let i = 0; i < faces.length; i++) {
      for (let j = 0; j < faces[i].length; j++) {
        const k = (j + 1) % faces[i].length;
        const t = faces[i][j].dist(faces[i][k]);
        if (t < shortedge) {
          shortedge = t;
        }
      }
    }
    this.shortedge = shortedge;
    if (this.verbose) {
      console.log("# Short edge is " + shortedge);
    }
    // add nxnxn cube notation if it has cube face moves
    if (shape === "c" && sawface && !sawedge && !sawvertex) {
      // In this case the mapper adding is deferred until we
      // know the number of slices.
      this.addNotationMapper = "NxNxNCubeMapper";
      // try to set Reid order of the cubies within an orbit
      this.setReidOrder = true;
    }
    if (shape === "c" && sawvertex && !sawface && !sawedge) {
      this.addNotationMapper = "SkewbMapper";
    }
    if (shape === "t" && (sawvertex || sawface) && !sawedge) {
      this.addNotationMapper = "PyraminxMapper";
    }
    if (shape === "o" && sawface && NEW_FACE_NAMES) {
      this.notationMapper = new FaceRenamingMapper(
        this.swizzler,
        new FaceNameSwizzler(["F", "D", "L", "BL", "R", "U", "BR", "B"]),
      );
      if (!sawedge && !sawvertex) {
        this.addNotationMapper = "FTOMapper";
      }
    }
    if (shape === "d" && sawface && NEW_FACE_NAMES) {
      this.addNotationMapper = "MegaminxMapper";
      this.notationMapper = new FaceRenamingMapper(
        this.swizzler,
        new FaceNameSwizzler([
          "U",
          "F",
          "L",
          "BL",
          "BR",
          "R",
          "FR",
          "FL",
          "DL",
          "B",
          "DR",
          "D",
        ]),
      );
    }
  }

  public keyface(face: Quat[]): string {
    return this.keyface2(centermassface(face));
  }

  public keyface2(cm: Quat): string {
    // take a face and figure out the sides of each move plane
    let s = "";
    for (let i = 0; i < this.moveplanesets.length; i++) {
      if (this.moveplanesets[i].length > 0) {
        const dv = cm.dot(this.moveplanesets[i][0]);
        let t = 0;
        let b = 1;
        while (b * 2 <= this.moveplanesets[i].length) {
          b *= 2;
        }
        for (; b > 0; b >>= 1) {
          if (
            t + b <= this.moveplanesets[i].length &&
            dv > this.moveplanesets[i][t + b - 1].a
          ) {
            t += b;
          }
        }
        s = s + " " + t;
      }
    }
    return s;
  }

  public findface(face: Quat[]): number {
    const cm = centermassface(face);
    const key = this.keyface2(cm);
    const arr = this.facelisthash[key];
    if (arr.length === 1) {
      return arr[0];
    }
    for (let i = 0; i + 1 < arr.length; i++) {
      const face2 = this.facelisthash[key][i];
      if (Math.abs(cm.dist(this.facecentermass[face2])) < eps) {
        return face2;
      }
    }
    return arr[arr.length - 1];
  }

  public findface2(cm: Quat): number {
    const key = this.keyface2(cm);
    const arr = this.facelisthash[key];
    if (arr.length === 1) {
      return arr[0];
    }
    for (let i = 0; i + 1 < arr.length; i++) {
      const face2 = this.facelisthash[key][i];
      if (Math.abs(cm.dist(this.facecentermass[face2])) < eps) {
        return face2;
      }
    }
    return arr[arr.length - 1];
  }

  public project2d(facen: number, edgen: number, targvec: Quat[]): any {
    // calculate geometry to map a particular edge of a particular
    //  face to a given 2D vector.  The face is given as an index into the
    //  facenames/baseplane arrays, and the edge is given as an offset into
    //  the vertices.
    const face = this.facenames[facen][0];
    const edgen2 = (edgen + 1) % face.length;
    const plane = this.baseplanes[facen];
    let x0 = face[edgen2].sub(face[edgen]);
    const olen = x0.len();
    x0 = x0.normalize();
    const y0 = x0.cross(plane).normalize();
    let delta = targvec[1].sub(targvec[0]);
    const len = delta.len() / olen;
    delta = delta.normalize();
    const cosr = delta.b;
    const sinr = delta.c;
    const x1 = x0.smul(cosr).sub(y0.smul(sinr)).smul(len);
    const y1 = y0.smul(cosr).sum(x0.smul(sinr)).smul(len);
    const off = new Quat(
      0,
      targvec[0].b - x1.dot(face[edgen]),
      targvec[0].c - y1.dot(face[edgen]),
      0,
    );
    return [x1, y1, off];
  }

}
