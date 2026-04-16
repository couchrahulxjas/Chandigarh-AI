import type { GraphData } from "../../state/types";
import type { SearchEnv, SearchResult } from "../types";
import { MinHeap } from "../priorityQueue";
import { reconstructPath } from "../reconstruct";
import { haversineMeters } from "../../utils/geo";

export function astar(
  graph: GraphData,
  start: number,
  goal: number,
  env: SearchEnv,
  _opts: { dlsLimit?: number } = {}
): SearchResult {
  const n = graph.nodes.length;
  const cameFrom = new Int32Array(n);
  cameFrom.fill(-1);
  const g = new Float64Array(n);
  g.fill(Number.POSITIVE_INFINITY);
  const closed = new Uint8Array(n);
  const heap = new MinHeap<number>();
  const visitedOrder: number[] = [];

  const goalLL = { lat: graph.nodes[goal].lat, lon: graph.nodes[goal].lon };
  g[start] = 0;
  heap.push(start, 0);

  while (heap.size() > 0) {
    const popped = heap.pop()!;
    const cur = popped.item;
    if (closed[cur]) continue;
    closed[cur] = 1;
    visitedOrder.push(cur);
    if (cur === goal) break;
    for (const e of graph.adj[cur]) {
      if (env.blocked.has(e.key)) continue;
      const step = env.hazardCostForMidpoint(e.mid, e.distMeters);
      const cand = g[cur] + step;
      if (cand < g[e.to]) {
        g[e.to] = cand;
        cameFrom[e.to] = cur;
        const nextLL = { lat: graph.nodes[e.to].lat, lon: graph.nodes[e.to].lon };
        const h = haversineMeters(nextLL, goalLL);
        heap.push(e.to, cand + h);
      }
    }
  }

  const finalPath = reconstructPath(cameFrom, start, goal);
  const found = finalPath.length > 0;
  return { found, visitedOrder, finalPath, totalCost: found ? g[goal] : Number.POSITIVE_INFINITY, totalDistMeters: NaN };
}
