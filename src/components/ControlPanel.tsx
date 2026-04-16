import { useEffect, useMemo } from "react";
import { useAppStore } from "../state/store";
import type { AlgoId } from "../state/types";
import { Button, Card, Label, Range, Toggle } from "./ui";
import { runScenario, runAllAlgorithms } from "../sim/runScenario";

const ALGOS: Array<{ id: AlgoId; name: string; desc: string }> = [
  { id: "BFS", name: "BFS", desc: "Unweighted baseline" },
  { id: "DFS", name: "DFS", desc: "Non-optimal exploration" },
  { id: "DLS", name: "DLS", desc: "Depth-limited DFS" },
  { id: "UCS", name: "UCS", desc: "True weighted shortest path" },
  { id: "GREEDY", name: "Greedy", desc: "Heuristic-only" },
  { id: "ASTAR", name: "A*", desc: "g + h (optimal w/ admissible h)" }
];

export function ControlPanel() {
  const initData = useAppStore((s) => s.actions.initData);
  const status = useAppStore((s) => s.data.status);
  const tool = useAppStore((s) => s.ui.tool);
  const setTool = useAppStore((s) => s.actions.setTool);
  const activeAlgo = useAppStore((s) => s.ui.activeAlgo);
  const setActiveAlgo = useAppStore((s) => s.actions.setActiveAlgo);
  const showRoads = useAppStore((s) => s.ui.showRoads);
  const showHazards = useAppStore((s) => s.ui.showHazards);
  const showExplored = useAppStore((s) => s.ui.showExplored);
  const showPath = useAppStore((s) => s.ui.showPath);
  const toggleLayer = useAppStore((s) => s.actions.toggleLayer);
  const speed = useAppStore((s) => s.ui.animationSpeed);
  const setSpeed = useAppStore((s) => s.actions.setAnimationSpeed);
  const dlsLimit = useAppStore((s) => s.ui.dlsLimit);
  const setDlsLimit = useAppStore((s) => s.actions.setDlsLimit);
  const hazardMultiplier = useAppStore((s) => s.ui.hazardMultiplier);
  const hazardRadiusMeters = useAppStore((s) => s.ui.hazardRadiusMeters);
  const hazardGrowth = useAppStore((s) => s.ui.hazardGrowth);
  const setHazardDefaults = useAppStore((s) => s.actions.setHazardDefaults);
  const clearScenario = useAppStore((s) => s.actions.clearScenario);
  const startNodes = useAppStore((s) => s.scenario.startNodes);
  const goalNode = useAppStore((s) => s.scenario.goalNode);
  const isRunning = useAppStore((s) => s.runs.isRunning);

  useEffect(() => {
    void initData();
  }, [initData]);

  const canRun = useMemo(
    () => status === "ready" && startNodes.length > 0 && goalNode !== null && !isRunning,
    [status, startNodes, goalNode, isRunning]
  );

  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-base font-semibold text-white/90">Scenario</div>
          <div className="text-xs text-white/60">Chandigarh road graph + dynamic hazards</div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={clearScenario} disabled={isRunning}>
            Clear
          </Button>
          <Button variant="success" onClick={() => void runAllAlgorithms()} disabled={!canRun}>
            Run All
          </Button>
          <Button onClick={() => void runScenario()} disabled={!canRun} className="animate-glow">
            Run
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant={tool === "start" ? "default" : "ghost"} onClick={() => setTool("start")}>
          Pick Start
        </Button>
        <Button variant={tool === "goal" ? "default" : "ghost"} onClick={() => setTool("goal")}>
          Pick Shelter
        </Button>
        <Button variant={tool === "hazard" ? "default" : "ghost"} onClick={() => setTool("hazard")}>
          Add Hazard
        </Button>
        <Button variant={tool === "blocked" ? "default" : "ghost"} onClick={() => setTool("blocked")}>
          Block Road
        </Button>
      </div>

      <div className="mt-4">
        <Label>Algorithm</Label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {ALGOS.map((a) => (
            <button
              key={a.id}
              onClick={() => setActiveAlgo(a.id)}
              className={[
                "rounded-xl border px-3 py-2 text-left text-sm transition",
                a.id === activeAlgo
                  ? "border-emerald-400/25 bg-emerald-500/10"
                  : "border-white/10 bg-white/5 hover:bg-white/8"
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-white/90">{a.name}</div>
                <div className="text-[11px] text-white/50">{a.id}</div>
              </div>
              <div className="text-xs text-white/60">{a.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Toggle value={showRoads} onChange={() => toggleLayer("roads")}>
          Roads
        </Toggle>
        <Toggle value={showHazards} onChange={() => toggleLayer("hazards")}>
          Hazards
        </Toggle>
        <Toggle value={showExplored} onChange={() => toggleLayer("explored")}>
          Explored
        </Toggle>
        <Toggle value={showPath} onChange={() => toggleLayer("path")}>
          Path
        </Toggle>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <Range
          label="Animation speed"
          min={50}
          max={20000}
          step={50}
          value={Number.isFinite(speed) ? speed : 20000}
          onChange={(v) => setSpeed(v >= 20000 ? Number.POSITIVE_INFINITY : v)}
          format={(v) => (v >= 20000 ? "instant" : `${v.toFixed(0)} nodes/s`)}
        />
        <Range label="DLS depth limit" min={10} max={2000} step={10} value={dlsLimit} onChange={setDlsLimit} />
      </div>

      <div className="mt-4">
        <Label>Hazard defaults</Label>
        <div className="mt-2 grid grid-cols-1 gap-3">
          <Range
            label="Multiplier"
            min={2}
            max={12}
            step={1}
            value={hazardMultiplier}
            onChange={(v) => setHazardDefaults(v, hazardRadiusMeters, hazardGrowth)}
            format={(v) => `${v.toFixed(0)}x`}
          />
          <Range
            label="Radius"
            min={50}
            max={2000}
            step={25}
            value={hazardRadiusMeters}
            onChange={(v) => setHazardDefaults(hazardMultiplier, v, hazardGrowth)}
            format={(v) => `${v.toFixed(0)} m`}
          />
          <Range
            label="Spread rate"
            min={0}
            max={80}
            step={2}
            value={hazardGrowth}
            onChange={(v) => setHazardDefaults(hazardMultiplier, hazardRadiusMeters, v)}
            format={(v) => (v <= 0 ? "off" : `${v.toFixed(0)} m/s`)}
          />
        </div>
        <div className="mt-2 text-xs text-white/55">Hazard tool: click to place a zone.</div>
      </div>
    </Card>
  );
}

