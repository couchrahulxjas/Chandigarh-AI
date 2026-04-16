import type { GraphData } from "../../state/types";
import type { SearchEnv, SearchResult } from "../types";
import { MinHeap } from "../priorityQueue";
import { reconstructPath } from "../reconstruct";

export function ucs(
  graph: GraphData,
  start: number,
  goal: number,
  env: SearchEnv,
  _opts: { dlsLimit?: number } = {}
): SearchResult {
  const n = graph.nodes.length;
  const cameFrom = new Int32Array(n);
  cameFrom.fill(-1);
  const best = new Float64Array(n);
  best.fill(Number.POSITIVE_INFINITY);
  const closed = new Uint8Array(n);
  const heap = new MinHeap<number>();
  const visitedOrder: number[] = [];

  best[start] = 0;
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
      const cand = best[cur] + step;
      if (cand < best[e.to]) {
        best[e.to] = cand;
        cameFrom[e.to] = cur;
        heap.push(e.to, cand);
      }
    }
  }

  const finalPath = reconstructPath(cameFrom, start, goal);
  const found = finalPath.length > 0;
  return { found, visitedOrder, finalPath, totalCost: found ? best[goal] : Number.POSITIVE_INFINITY, totalDistMeters: NaN };
}
