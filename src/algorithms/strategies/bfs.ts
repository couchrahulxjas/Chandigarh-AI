import type { GraphData } from "../../state/types";
import type { SearchEnv, SearchResult } from "../types";
import { reconstructPath } from "../reconstruct";

export function bfs(
  graph: GraphData,
  start: number,
  goal: number,
  env: SearchEnv,
  _opts: { dlsLimit?: number } = {}
): SearchResult {
  const n = graph.nodes.length;
  const cameFrom = new Int32Array(n);
  cameFrom.fill(-1);
  const visited = new Uint8Array(n);
  const q = new Int32Array(n);
  let qh = 0;
  let qt = 0;

  visited[start] = 1;
  q[qt++] = start;
  const visitedOrder: number[] = [];

  while (qh < qt) {
    const cur = q[qh++];
    visitedOrder.push(cur);
    if (cur === goal) break;
    for (const e of graph.adj[cur]) {
      if (env.blocked.has(e.key)) continue;
      if (visited[e.to]) continue;
      visited[e.to] = 1;
      cameFrom[e.to] = cur;
      q[qt++] = e.to;
    }
  }

  const finalPath = reconstructPath(cameFrom, start, goal);
  return { found: finalPath.length > 0, visitedOrder, finalPath, totalCost: NaN, totalDistMeters: NaN };
}
