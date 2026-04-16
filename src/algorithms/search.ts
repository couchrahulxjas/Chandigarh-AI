import type { AlgoId, GraphData } from "../state/types";
import type { SearchEnv, SearchResult } from "./types";
import { bfs } from "./strategies/bfs";
import { dfs } from "./strategies/dfs";
import { dls } from "./strategies/dls";
import { ucs } from "./strategies/ucs";
import { greedy } from "./strategies/greedy";
import { astar } from "./strategies/astar";

export type SearchOptions = { dlsLimit?: number };

export function runSearch(
  algo: AlgoId,
  graph: GraphData,
  start: number,
  goal: number,
  env: SearchEnv,
  opts: SearchOptions
): SearchResult {
  const fn =
    algo === "BFS"
      ? bfs
      : algo === "DFS"
        ? dfs
        : algo === "DLS"
          ? dls
          : algo === "UCS"
            ? ucs
            : algo === "GREEDY"
              ? greedy
              : astar;
  return fn(graph, start, goal, env, opts);
}

