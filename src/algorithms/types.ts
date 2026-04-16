import type { GraphData, HazardZone, LatLng } from "../state/types";

export type SearchEnv = {
  blocked: Set<string>;
  hazards: HazardZone[];
  hazardCostForMidpoint: (mid: LatLng, baseDist: number) => number;
};

export type SearchResult = {
  found: boolean;
  visitedOrder: number[];
  finalPath: number[];
  totalCost: number;
  totalDistMeters: number;
};

export type StrategyFn = (
  graph: GraphData,
  start: number,
  goal: number,
  env: SearchEnv,
  opts?: { dlsLimit?: number }
) => SearchResult;

