import type { GraphData } from "../state/types";
import { fallbackGraphData, fallbackRoadsGeojson } from "./fallbackData";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return (await res.json()) as T;
}

export async function loadGraphData(): Promise<{ graph: GraphData; roadsGeojson: GeoJSON.FeatureCollection }> {
  try {
    const [graph, roads] = await Promise.all([
      fetchJson<GraphData>("/data/chandigarh-graph.json"),
      fetchJson<GeoJSON.FeatureCollection>("/data/chandigarh-roads.geojson")
    ]);
    return { graph, roadsGeojson: roads };
  } catch {
    return { graph: fallbackGraphData, roadsGeojson: fallbackRoadsGeojson };
  }
}

