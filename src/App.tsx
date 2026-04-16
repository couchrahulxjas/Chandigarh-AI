import { MapView } from "./components/MapView";
import { ControlPanel } from "./components/ControlPanel";
import { MetricsPanel } from "./components/MetricsPanel";
import { useAppStore } from "./state/store";

export function App() {
  const dataStatus = useAppStore((s) => s.data.status);
  const dataError = useAppStore((s) => s.data.error);

  return (
    <div className="h-full w-full bg-bg-950">
      <div className="absolute inset-0">
        <MapView />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-start justify-between gap-4 p-4">
        <div className="pointer-events-auto w-[420px] max-w-[92vw]">
          <ControlPanel />
        </div>
        <div className="pointer-events-auto w-[420px] max-w-[92vw]">
          <MetricsPanel />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1000] p-4 text-[11px]">
        <div className="pointer-events-auto mx-auto max-w-5xl glass-panel px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-white/80">
            <div className="flex items-center gap-3">
              <span className="text-white/90">Chandigarh Evacuation Lab</span>
              <span className="h-4 w-px bg-white/10" />
              <span>
                Data:{" "}
                <span className={dataStatus === "ready" ? "text-emerald-300" : "text-amber-300"}>
                  {dataStatus}
                </span>
              </span>
              {dataStatus === "error" ? <span className="text-rose-300">{dataError}</span> : null}
            </div>
            <div className="text-white/60">
              Tip: pick Start + Shelter, add Hazards / Blocked roads, run algorithms, and compare cost vs. UCS.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

