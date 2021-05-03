
export const cube3x3x3 = {
  def: async () => {
    // return await import("./3x3x3.kpuzzle.json");
    return {};
  },
  pg: async () => {
    console.log(await import("../puzzle-geometry"));
  },
};
