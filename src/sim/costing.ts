import type { GraphData, HazardZone, LatLng } from "../state/types";
import { haversineMeters } from "../utils/geo";

export function buildHazardCostFn(hazards: HazardZone[]) {
  const enabled = hazards.filter((h) => h.enabled && h.radiusMeters > 0 && h.multiplier > 1);
  if (enabled.length === 0) return (mid: LatLng, baseDist: number) => baseDist;
  return (mid: LatLng, baseDist: number) => {
    let multiplier = 1;
    for (const z of enabled) {
      const d = haversineMeters(mid, z.center);
      if (d <= z.radiusMeters) multiplier = Math.max(multiplier, z.multiplier);
    }
    return baseDist * multiplier;
  };
}

export function computePathDistanceMeters(graph: GraphData, path: number[]) {
  if (path.length < 2) return 0;
  let dist = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const edge = graph.adj[a].find((e) => e.to === b);
    if (edge) dist += edge.distMeters;
  }
  return dist;
}

export function computePathCost(
  graph: GraphData,
  path: number[],
  hazardCostForMidpoint: (mid: LatLng, baseDist: number) => number
) {
  if (path.length < 2) return 0;
  let cost = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const edge = graph.adj[a].find((e) => e.to === b);
    if (edge) cost += hazardCostForMidpoint(edge.mid, edge.distMeters);
  }
  return cost;
}

