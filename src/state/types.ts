export type LatLng = { lat: number; lon: number };

export type HazardZone = {
  id: string;
  center: LatLng;
  radiusMeters: number;
  multiplier: number;
  growthMetersPerSec: number;
  enabled: boolean;
};

export type GraphEdge = {
  to: number;
  distMeters: number;
  key: string; // "a-b" where a < b
  mid: LatLng; // midpoint for hazard checks
};

export type GraphNode = {
  id: number;
  lat: number;
  lon: number;
};

export type GraphData = {
  nodes: GraphNode[];
  adj: GraphEdge[][];
  ways?: Record<string, string[]>; // wayId -> edge keys
};

export type DataStatus = "loading" | "ready" | "error";

export type AlgoId = "BFS" | "DFS" | "DLS" | "UCS" | "GREEDY" | "ASTAR";

export type RunMetrics = {
  algo: AlgoId;
  execMs: number;
  nodesExplored: number;
  pathDistMeters: number;
  pathCost: number;
  optimalCost: number | null;
  isOptimal: boolean | null;
};

export type RunResult = {
  algo: AlgoId;
  found: boolean;
  // Multi-source support:
  // Each source node has its own visited order and final path.
  sources: Array<{
    startNode: number;
    visitedOrder: number[];
    finalPath: number[];
    distMeters: number;
    cost: number;
  }>;
  // Aggregated metrics for display
  metrics: RunMetrics & {
    avgDistMeters: number;
    avgCost: number;
  };
};

