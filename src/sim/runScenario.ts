import { runSearch } from "../algorithms/search";
import { useAppStore } from "../state/store";
import { buildHazardCostFn, computePathCost, computePathDistanceMeters } from "./costing";
import type { AlgoId, RunResult } from "../state/types";

export async function runScenario() {
  const state = useAppStore.getState();
  const graph = state.data.graph;
  if (!graph) return;
  const starts = state.scenario.startNodes;
  const goal = state.scenario.goalNode;
  if (starts.length === 0 || goal === null) return;

  useAppStore.getState().actions.setIsRunning(true);
  useAppStore.getState().actions.setAnimationProgress(0);

  const hazards = state.scenario.hazards;
  const hazardCostForMidpoint = buildHazardCostFn(hazards);
  const env = { blocked: state.scenario.blockedEdgeKeys, hazards, hazardCostForMidpoint };

  const algo = state.ui.activeAlgo;
  const sourcesResults = [];
  let totalExecMs = 0;
  let totalNodesExplored = 0;
  let allFound = true;

  for (const start of starts) {
    const t0 = performance.now();
    const result = runSearch(algo, graph, start, goal, env, { dlsLimit: state.ui.dlsLimit });
    const t1 = performance.now();
    
    totalExecMs += (t1 - t0);
    totalNodesExplored += result.visitedOrder.length;
    if (!result.found) allFound = false;

    const pathDistMeters = computePathDistanceMeters(graph, result.finalPath);
    const pathCost = computePathCost(graph, result.finalPath, hazardCostForMidpoint);

    sourcesResults.push({
      startNode: start,
      visitedOrder: result.visitedOrder,
      finalPath: result.finalPath,
      distMeters: pathDistMeters,
      cost: pathCost
    });
  }

  // Compute optimality using UCS on first start node for reference in metrics
  let optimalCost: number | null = null;
  try {
    const optimal = runSearch("UCS", graph, starts[0], goal, env, {});
    optimalCost = optimal.found ? optimal.totalCost : null;
  } catch {
    optimalCost = null;
  }

  const avgCost = sourcesResults.reduce((a, b) => a + b.cost, 0) / starts.length;
  const avgDist = sourcesResults.reduce((a, b) => a + b.distMeters, 0) / starts.length;

  const run: RunResult = {
    algo,
    found: allFound,
    sources: sourcesResults,
    metrics: {
      algo,
      execMs: totalExecMs,
      nodesExplored: totalNodesExplored,
      pathDistMeters: sourcesResults[0].distMeters, // principal source
      pathCost: sourcesResults[0].cost,           // principal source
      avgDistMeters: avgDist,
      avgCost: avgCost,
      optimalCost,
      isOptimal: optimalCost === null ? null : Math.abs(sourcesResults[0].cost - optimalCost) < 1e-6
    }
  };

  useAppStore.getState().actions.setRun(run);
  useAppStore.getState().actions.setIsRunning(false);

  const speed = useAppStore.getState().ui.animationSpeed;
  if (!Number.isFinite(speed) || speed <= 0) {
    useAppStore.getState().actions.setAnimationProgress(Number.POSITIVE_INFINITY);
    return;
  }

  const startTs = performance.now();
  const maxVisited = Math.max(...sourcesResults.map(s => s.visitedOrder.length));
  const tick = () => {
    const now = performance.now();
    const elapsed = (now - startTs) / 1000;
    const progress = Math.min(maxVisited, elapsed * speed);
    useAppStore.getState().actions.setAnimationProgress(progress);
    if (progress < maxVisited) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export async function runAllAlgorithms() {
  const state = useAppStore.getState();
  const graph = state.data.graph;
  if (!graph) return;
  const starts = state.scenario.startNodes;
  const goal = state.scenario.goalNode;
  if (starts.length === 0 || goal === null) return;

  const algos: AlgoId[] = ["BFS", "DFS", "DLS", "UCS", "GREEDY", "ASTAR"];
  const hazards = state.scenario.hazards;
  const hazardCostForMidpoint = buildHazardCostFn(hazards);
  const env = { blocked: state.scenario.blockedEdgeKeys, hazards, hazardCostForMidpoint };

  useAppStore.getState().actions.setIsRunning(true);
  
  // First compute UCS to get optimal cost for reference
  const ucs = runSearch("UCS", graph, starts[0], goal, env, {});
  const optimalCost = ucs.found ? ucs.totalCost : null;

  for (const algoId of algos) {
    const sourcesResults = [];
    let totalExecMs = 0;
    let totalNodesExplored = 0;
    let allFound = true;

    for (const start of starts) {
      const t0 = performance.now();
      const result = runSearch(algoId, graph, start, goal, env, { dlsLimit: state.ui.dlsLimit });
      const t1 = performance.now();
      
      totalExecMs += (t1 - t0);
      totalNodesExplored += result.visitedOrder.length;
      if (!result.found) allFound = false;

      const pathDistMeters = computePathDistanceMeters(graph, result.finalPath);
      const pathCost = computePathCost(graph, result.finalPath, hazardCostForMidpoint);

      sourcesResults.push({
        startNode: start,
        visitedOrder: result.visitedOrder,
        finalPath: result.finalPath,
        distMeters: pathDistMeters,
        cost: pathCost
      });
    }

    const avgCost = sourcesResults.reduce((a, b) => a + b.cost, 0) / starts.length;
    const avgDist = sourcesResults.reduce((a, b) => a + b.distMeters, 0) / starts.length;

    const run: RunResult = {
      algo: algoId,
      found: allFound,
      sources: sourcesResults,
      metrics: {
        algo: algoId,
        execMs: totalExecMs,
        nodesExplored: totalNodesExplored,
        pathDistMeters: sourcesResults[0].distMeters,
        pathCost: sourcesResults[0].cost,
        avgDistMeters: avgDist,
        avgCost: avgCost,
        optimalCost,
        isOptimal: optimalCost === null ? null : Math.abs(sourcesResults[0].cost - optimalCost) < 1e-6
      }
    };
    useAppStore.getState().actions.setRun(run);
  }

  useAppStore.getState().actions.setIsRunning(false);
  useAppStore.getState().actions.setAnimationProgress(Number.POSITIVE_INFINITY);
}
