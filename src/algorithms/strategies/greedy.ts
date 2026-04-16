import type { GraphData } from "../../state/types";
import type { SearchEnv, SearchResult } from "../types";
import { MinHeap } from "../priorityQueue";
import { reconstructPath } from "../reconstruct";
import { haversineMeters } from "../../utils/geo";

export function greedy(
  graph: GraphData,
  start: number,
  goal: number,
  env: SearchEnv,
  _opts: { dlsLimit?: number } = {}
): SearchResult {
  const n = graph.nodes.length;
  const cameFrom = new Int32Array(n);
  cameFrom.fill(-1);
  const closed = new Uint8Array(n);
  const heap = new MinHeap<number>();
  const visitedOrder: number[] = [];

  const goalLL = { lat: graph.nodes[goal].lat, lon: graph.nodes[goal].lon };
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
      if (closed[e.to]) continue;
      if (cameFrom[e.to] === -1) cameFrom[e.to] = cur;
      const ll = { lat: graph.nodes[e.to].lat, lon: graph.nodes[e.to].lon };
      heap.push(e.to, haversineMeters(ll, goalLL));
    }
  }

  const finalPath = reconstructPath(cameFrom, start, goal);
  return { found: finalPath.length > 0, visitedOrder, finalPath, totalCost: NaN, totalDistMeters: NaN };
}
