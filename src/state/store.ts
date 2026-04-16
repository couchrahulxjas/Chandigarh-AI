import { create } from "zustand";
import type { AlgoId, DataStatus, GraphData, HazardZone, LatLng, RunResult } from "./types";
import { loadGraphData } from "../utils/loadGraphData";
import { randomId } from "../utils/randomId";

type ToolMode = "start" | "goal" | "hazard" | "blocked" | "pan";

type AppState = {
  data: {
    status: DataStatus;
    error: string | null;
    graph: GraphData | null;
    roadsGeojson: GeoJSON.FeatureCollection | null;
  };
  ui: {
    tool: ToolMode;
    showRoads: boolean;
    showHazards: boolean;
    showExplored: boolean;
    showPath: boolean;
    animationSpeed: number; // nodes/sec, Infinity = instant
    dlsLimit: number;
    hazardMultiplier: number;
    hazardRadiusMeters: number;
    hazardGrowth: number;
    activeAlgo: AlgoId;
  };
  scenario: {
    startNodes: number[];
    goalNode: number | null;
    blockedEdgeKeys: Set<string>;
    hazards: HazardZone[];
  };
  runs: {
    last: RunResult | null;
    history: Record<AlgoId, RunResult | null>;
    isRunning: boolean;
    animationProgress: number; // visited nodes revealed
  };
  actions: {
    initData: () => Promise<void>;
    setTool: (tool: ToolMode) => void;
    setActiveAlgo: (algo: AlgoId) => void;
    setAnimationSpeed: (speed: number) => void;
    setDlsLimit: (limit: number) => void;
    toggleStartNode: (nodeId: number) => void;
    setGoalNode: (nodeId: number) => void;
    toggleLayer: (key: "roads" | "hazards" | "explored" | "path") => void;
    clearScenario: () => void;
    addHazardAt: (latlng: LatLng) => void;
    toggleBlockedWay: (wayId: string) => void;
    tickHazards: (dtSec: number) => void;
    setHazardDefaults: (multiplier: number, radiusMeters: number, growth: number) => void;
    setRun: (run: RunResult | null) => void;
    setIsRunning: (running: boolean) => void;
    setAnimationProgress: (progress: number) => void;
  };
};

export const useAppStore = create<AppState>((set, get) => ({
  data: {
    status: "loading",
    error: null,
    graph: null,
    roadsGeojson: null
  },
  ui: {
    tool: "start",
    showRoads: true,
    showHazards: true,
    showExplored: true,
    showPath: true,
    animationSpeed: 3000,
    dlsLimit: 250,
    hazardMultiplier: 5,
    hazardRadiusMeters: 350,
    hazardGrowth: 0,
    activeAlgo: "ASTAR"
  },
  scenario: {
    startNodes: [],
    goalNode: null,
    blockedEdgeKeys: new Set<string>(),
    hazards: []
  },
  runs: {
    last: null,
    history: {
      BFS: null,
      DFS: null,
      DLS: null,
      UCS: null,
      GREEDY: null,
      ASTAR: null
    },
    isRunning: false,
    animationProgress: 0
  },
  actions: {
    initData: async () => {
      set((s) => ({ data: { ...s.data, status: "loading", error: null } }));
      try {
        const { graph, roadsGeojson } = await loadGraphData();
        set((s) => ({ data: { ...s.data, status: "ready", graph, roadsGeojson } }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load data";
        set((s) => ({ data: { ...s.data, status: "error", error: message } }));
      }
    },
    setTool: (tool) => set((s) => ({ ui: { ...s.ui, tool } })),
    setActiveAlgo: (activeAlgo) => set((s) => ({ ui: { ...s.ui, activeAlgo } })),
    setAnimationSpeed: (animationSpeed) => set((s) => ({ ui: { ...s.ui, animationSpeed } })),
    setDlsLimit: (dlsLimit) => set((s) => ({ ui: { ...s.ui, dlsLimit } })),
    toggleStartNode: (nodeId) =>
      set((s) => {
        const nodes = s.scenario.startNodes.includes(nodeId)
          ? s.scenario.startNodes.filter((id) => id !== nodeId)
          : [...s.scenario.startNodes, nodeId];
        return { scenario: { ...s.scenario, startNodes: nodes }, runs: { ...s.runs, last: null, animationProgress: 0 } };
      }),
    setGoalNode: (goalNode) =>
      set((s) => ({ scenario: { ...s.scenario, goalNode }, runs: { ...s.runs, last: null, animationProgress: 0 } })),
    toggleLayer: (key) =>
      set((s) => {
        if (key === "roads") return { ui: { ...s.ui, showRoads: !s.ui.showRoads } };
        if (key === "hazards") return { ui: { ...s.ui, showHazards: !s.ui.showHazards } };
        if (key === "explored") return { ui: { ...s.ui, showExplored: !s.ui.showExplored } };
        return { ui: { ...s.ui, showPath: !s.ui.showPath } };
      }),
    clearScenario: () =>
      set((s) => ({
        scenario: { ...s.scenario, blockedEdgeKeys: new Set(), hazards: [] },
        runs: { ...s.runs, last: null, animationProgress: 0, isRunning: false }
      })),
    addHazardAt: (latlng) => {
      const { hazardMultiplier, hazardRadiusMeters, hazardGrowth } = get().ui;
      const zone: HazardZone = {
        id: randomId(),
        center: latlng,
        radiusMeters: hazardRadiusMeters,
        multiplier: hazardMultiplier,
        growthMetersPerSec: hazardGrowth,
        enabled: true
      };
      set((s) => ({ scenario: { ...s.scenario, hazards: [zone, ...s.scenario.hazards] } }));
    },
    toggleBlockedWay: (wayId) => {
      const graph = get().data.graph;
      if (!graph?.ways?.[wayId]) return;
      const wayEdges = graph.ways[wayId];
      const blocked = new Set(get().scenario.blockedEdgeKeys);
      const shouldBlock = wayEdges.some((k) => !blocked.has(k));
      for (const key of wayEdges) {
        if (shouldBlock) blocked.add(key);
        else blocked.delete(key);
      }
      set((s) => ({ scenario: { ...s.scenario, blockedEdgeKeys: blocked } }));
    },
    tickHazards: (dtSec) =>
      set((s) => ({
        scenario: {
          ...s.scenario,
          hazards: s.scenario.hazards.map((z) =>
            z.enabled && z.growthMetersPerSec > 0
              ? { ...z, radiusMeters: Math.max(0, z.radiusMeters + z.growthMetersPerSec * dtSec) }
              : z
          )
        }
      })),
    setHazardDefaults: (multiplier, radiusMeters, growth) =>
      set((s) => ({ ui: { ...s.ui, hazardMultiplier: multiplier, hazardRadiusMeters: radiusMeters, hazardGrowth: growth } })),
    setRun: (run) =>
      set((s) => ({
        runs: run
          ? { ...s.runs, last: run, history: { ...s.runs.history, [run.algo]: run }, animationProgress: 0 }
          : { ...s.runs, last: null, animationProgress: 0 }
      })),
    setIsRunning: (isRunning) => set((s) => ({ runs: { ...s.runs, isRunning } })),
    setAnimationProgress: (animationProgress) => set((s) => ({ runs: { ...s.runs, animationProgress } }))
  }
}));
