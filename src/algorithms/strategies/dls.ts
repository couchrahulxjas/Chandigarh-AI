import type { GraphData } from "../../state/types";
import type { SearchEnv, SearchResult } from "../types";
import { reconstructPath } from "../reconstruct";

type Frame = { node: number; depth: number };

export function dls(
  graph: GraphData,
  start: number,
  goal: number,
  env: SearchEnv,
  opts: { dlsLimit?: number } = {}
): SearchResult {
  const limit = Math.max(0, opts.dlsLimit ?? 250);
  const n = graph.nodes.length;
  const cameFrom = new Int32Array(n);
  cameFrom.fill(-1);
  const visited = new Uint8Array(n);
  const stack: Frame[] = [{ node: start, depth: 0 }];
  const visitedOrder: number[] = [];

  while (stack.length > 0) {
    const { node: cur, depth } = stack.pop()!;
    if (visited[cur]) continue;
    visited[cur] = 1;
    visitedOrder.push(cur);
    if (cur === goal) break;
    if (depth >= limit) continue;
    const neighbors = graph.adj[cur];
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const e = neighbors[i];
      if (env.blocked.has(e.key)) continue;
      if (!visited[e.to]) {
        if (cameFrom[e.to] === -1) cameFrom[e.to] = cur;
        stack.push({ node: e.to, depth: depth + 1 });
      }
    }
  }

  const finalPath = reconstructPath(cameFrom, start, goal);
  return { found: finalPath.length > 0, visitedOrder, finalPath, totalCost: NaN, totalDistMeters: NaN };
}

