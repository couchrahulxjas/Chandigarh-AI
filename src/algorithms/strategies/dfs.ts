import type { GraphData } from "../../state/types";
import type { SearchEnv, SearchResult } from "../types";
import { reconstructPath } from "../reconstruct";

export function dfs(
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
  const stack = new Int32Array(n);
  let sp = 0;

  stack[sp++] = start;
  const visitedOrder: number[] = [];

  while (sp > 0) {
    const cur = stack[--sp];
    if (visited[cur]) continue;
    visited[cur] = 1;
    visitedOrder.push(cur);
    if (cur === goal) break;
    const neighbors = graph.adj[cur];
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const e = neighbors[i];
      if (env.blocked.has(e.key)) continue;
      if (!visited[e.to]) {
        if (cameFrom[e.to] === -1) cameFrom[e.to] = cur;
        stack[sp++] = e.to;
      }
    }
  }

  const finalPath = reconstructPath(cameFrom, start, goal);
  return { found: finalPath.length > 0, visitedOrder, finalPath, totalCost: NaN, totalDistMeters: NaN };
}
