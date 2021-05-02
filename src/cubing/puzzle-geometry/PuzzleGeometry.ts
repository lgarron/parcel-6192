/* tslint:disable no-bitwise */
/* tslint:disable prefer-for-of */ // TODO
/* tslint:disable only-arrow-functions */ // TODO
/* tslint:disable typedef */ // TODO

import { FaceNameSwizzler } from "./FaceNameSwizzler";
import {
  NotationMapper,
  NullMapper
} from "./NotationMapper";
import { Quat } from "./Quat";


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
