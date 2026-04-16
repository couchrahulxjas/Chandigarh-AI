import { useMemo } from "react";
import { useAppStore } from "../state/store";
import { Card, Label } from "./ui";
import { formatMeters } from "../utils/geo";
import type { AlgoId } from "../state/types";

function pct(ok: boolean | null) {
  if (ok === null) return "—";
  return ok ? "Yes" : "No";
}

function algoName(id: AlgoId) {
  if (id === "GREEDY") return "Greedy";
  if (id === "ASTAR") return "A*";
  return id;
}

export function MetricsPanel() {
  const last = useAppStore((s) => s.runs.last);
  const history = useAppStore((s) => s.runs.history);
  const isRunning = useAppStore((s) => s.runs.isRunning);

  const rows = useMemo(() => {
    const order: AlgoId[] = ["BFS", "DFS", "DLS", "UCS", "GREEDY", "ASTAR"];
    return order
      .map((id) => history[id])
      .filter(Boolean)
      .map((r) => ({
        id: r!.algo,
        execMs: r!.metrics.execMs,
        explored: r!.metrics.nodesExplored,
        avgCost: r!.metrics.avgCost,
        optimal: r!.metrics.isOptimal
      }));
  }, [history]);

  return (
    <Card className="max-h-[85vh] overflow-y-auto">
      <div className="flex items-start justify-between gap-2 border-b border-white/5 pb-3">
        <div>
          <div className="text-base font-bold tracking-tight text-white/95">Metrics Dashboard</div>
          <div className="text-[10px] font-medium uppercase text-white/30">Dynamic Hazard Analysis</div>
        </div>
        <div className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${isRunning ? 'bg-amber-500/10 text-amber-400 animate-pulse' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {isRunning ? "Simulating..." : last ? `${algoName(last.algo)}` : "Standby"}
        </div>
      </div>

      {last ? (
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]">
            <Label>Avg Distance</Label>
            <div className="mt-1 font-mono text-lg font-medium text-white/90">{formatMeters(last.metrics.avgDistMeters)}</div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]">
            <Label>Avg Cost (w/ Hazards)</Label>
            <div className="mt-1 font-mono text-lg font-medium text-emerald-400">{formatMeters(last.metrics.avgCost)}</div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <Label>Nodes Explored</Label>
            <div className="mt-1 font-mono text-white/80">{last.metrics.nodesExplored.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <Label>Runtime</Label>
            <div className="mt-1 font-mono text-white/80">{last.metrics.execMs.toFixed(2)} ms</div>
          </div>
          <div className="col-span-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-center justify-between">
            <Label>Optimal Path Found</Label>
            <div className={`font-mono font-bold ${last.metrics.isOptimal ? 'text-emerald-400' : 'text-rose-400'}`}>
              {pct(last.metrics.isOptimal)}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-8 text-center">
          <div className="text-sm text-white/30 italic">Initialize scenario to see real-time pathfinding metrics</div>
        </div>
      )}

      {rows.length > 1 ? (
        <div className="mt-6">
          <div className="mb-2 px-1 flex items-center justify-between">
            <Label>Algorithm Comparison</Label>
            <span className="text-[10px] text-white/20 italic">Latest runs</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-white/5 text-white/40 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-3 py-2.5">Algo</th>
                  <th className="px-3 py-2.5">Avg Cost</th>
                  <th className="px-3 py-2.5">Explored</th>
                  <th className="px-3 py-2.5">Optimal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-white/5">
                    <td className="px-3 py-3 font-semibold text-white/90">{algoName(r.id)}</td>
                    <td className="px-3 py-3 font-mono text-emerald-400/80">{formatMeters(r.avgCost)}</td>
                    <td className="px-3 py-3 font-mono text-white/50">{r.explored.toLocaleString()}</td>
                    <td className={`px-3 py-3 font-bold ${r.optimal ? 'text-emerald-400' : 'text-rose-400/70'}`}>
                      {r.optimal ? '✓' : '✗'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

