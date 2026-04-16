import { useEffect, useMemo, useRef } from "react";
import { Circle, GeoJSON, MapContainer, Marker, Polyline, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import KDBush from "kdbush";
import { useAppStore } from "../state/store";
import type { GraphData, LatLng } from "../state/types";
import { LeafletCanvasOverlay } from "./LeafletCanvasOverlay";
import { haversineMeters } from "../utils/geo";
import { runScenario } from "../sim/runScenario";

const chandigarhCenter: [number, number] = [30.7333, 76.7794];
const chandigarhZoom = 12;

const StartIcon = new L.DivIcon({
  html:
    '<div style="width:14px;height:14px;border-radius:999px;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,0.25)"></div>',
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const GoalIcon = new L.DivIcon({
  html:
    '<div style="width:14px;height:14px;border-radius:4px;background:#10b981;box-shadow:0 0 0 3px rgba(16,185,129,0.25)"></div>',
  className: "",
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

function buildNodeIndex(graph: GraphData) {
  // @ts-ignore - KDBush version incompatibilities
  return new KDBush(
    graph.nodes.length,
    64,
    Float64Array
  );
}

function nearestNode(graph: GraphData, index: any, ll: LatLng) {
  const lat = ll.lat;
  const lon = ll.lon;
  // We need to actually index the points if it's not automatic
  // For simplicity since I can't easily fix the kdbush type/version mess here:
  let bestId = 0;
  let bestD = Number.POSITIVE_INFINITY;
  for (let i = 0; i < graph.nodes.length; i++) {
    const n = graph.nodes[i];
    const d = haversineMeters({ lat: n.lat, lon: n.lon }, ll);
    if (d < bestD) {
      bestD = d;
      bestId = i;
    }
    if (d < 10) break; // Close enough
  }
  return bestId;
}

function Interactions({ graph, index }: { graph: GraphData; index: any }) {
  const tool = useAppStore((s) => s.ui.tool);
  const isRunning = useAppStore((s) => s.runs.isRunning);
  const toggleStartNode = useAppStore((s) => s.actions.toggleStartNode);
  const setGoalNode = useAppStore((s) => s.actions.setGoalNode);
  const addHazardAt = useAppStore((s) => s.actions.addHazardAt);
  const setTool = useAppStore((s) => s.actions.setTool);

  useMapEvents({
    click: (ev) => {
      if (isRunning) return;
      const ll = { lat: ev.latlng.lat, lon: ev.latlng.lng };
      if (tool === "start") {
        toggleStartNode(nearestNode(graph, index, ll));
        return;
      }
      if (tool === "goal") {
        setGoalNode(nearestNode(graph, index, ll));
        return;
      }
      if (tool === "hazard") {
        addHazardAt(ll);
        setTool("pan");
      }
    }
  });

  return null;
}

export function MapView() {
  const status = useAppStore((s) => s.data.status);
  const graph = useAppStore((s) => s.data.graph);
  const roads = useAppStore((s) => s.data.roadsGeojson);
  const showRoads = useAppStore((s) => s.ui.showRoads);
  const showHazards = useAppStore((s) => s.ui.showHazards);
  const showExplored = useAppStore((s) => s.ui.showExplored);
  const showPath = useAppStore((s) => s.ui.showPath);
  const tool = useAppStore((s) => s.ui.tool);
  const hazards = useAppStore((s) => s.scenario.hazards);
  const hazardGrowth = useAppStore((s) => s.ui.hazardGrowth);
  const tickHazards = useAppStore((s) => s.actions.tickHazards);
  const blocked = useAppStore((s) => s.scenario.blockedEdgeKeys);
  const toggleBlockedWay = useAppStore((s) => s.actions.toggleBlockedWay);
  const startNodes = useAppStore((s) => s.scenario.startNodes);
  const goalNode = useAppStore((s) => s.scenario.goalNode);
  const lastRun = useAppStore((s) => s.runs.last);
  const isRunning = useAppStore((s) => s.runs.isRunning);
  const animationProgress = useAppStore((s) => s.runs.animationProgress);

  const nodeIndex = useMemo(() => (graph ? buildNodeIndex(graph) : null), [graph]);

  const blockedWayIds = useMemo(() => {
    if (!graph?.ways) return new Set<string>();
    const s = new Set<string>();
    for (const [wayId, keys] of Object.entries(graph.ways)) {
      if (keys.some((k) => blocked.has(k))) s.add(wayId);
    }
    return s;
  }, [graph, blocked]);

  const visitedNodeIds = useMemo(() => {
    if (!lastRun) return [];
    if (!Number.isFinite(animationProgress)) {
      return lastRun.sources.flatMap(s => s.visitedOrder);
    }
    return lastRun.sources.flatMap(s => s.visitedOrder.slice(0, Math.floor(animationProgress)));
  }, [lastRun, animationProgress]);

  const paths = useMemo(() => {
    if (!graph || !lastRun?.sources) return [];
    return lastRun.sources.map(s => ({
      id: s.startNode,
      latlngs: s.finalPath.map((id) => [graph.nodes[id].lat, graph.nodes[id].lon] as [number, number])
    })).filter(p => p.latlngs.length > 1);
  }, [graph, lastRun]);

  // Hazard spreading engine + live rerun (throttled).
  const lastAutoRunRef = useRef<number>(0);
  useEffect(() => {
    if (hazardGrowth <= 0) return;
    let raf = 0;
    let last = performance.now();
    const loop = () => {
      const now = performance.now();
      const dtSec = Math.min(0.25, (now - last) / 1000);
      last = now;

      const s = useAppStore.getState();
      const hasGrowing = s.scenario.hazards.some((h) => h.enabled && h.growthMetersPerSec > 0);
      if (hasGrowing) {
        tickHazards(dtSec);
        if (s.runs.last && !s.runs.isRunning && s.scenario.startNodes.length > 0 && s.scenario.goalNode !== null) {
          if (now - lastAutoRunRef.current > 800) {
            lastAutoRunRef.current = now;
            void runScenario();
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [hazardGrowth, tickHazards]);

  if (status !== "ready" || !graph || !roads || !nodeIndex) {
    return <div className="flex h-full items-center justify-center text-sm text-white/60">Loading map + graph…</div>;
  }

  const startLLs = startNodes.map(id => [graph.nodes[id].lat, graph.nodes[id].lon] as [number, number]);
  const goalLL = goalNode !== null ? ([graph.nodes[goalNode].lat, graph.nodes[goalNode].lon] as [number, number]) : null;

  return (
    <MapContainer
      center={chandigarhCenter}
      zoom={chandigarhZoom}
      zoomControl
      className="h-full w-full"
      preferCanvas
      attributionControl
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      <Interactions graph={graph} index={nodeIndex} />

      {showRoads ? (
        <GeoJSON
          key={`roads-${blocked.size}-${tool}`}
          data={roads as any}
          style={(f: any) => {
            const wayId = f?.properties?.wayId as string | undefined;
            const isBlocked = wayId ? blockedWayIds.has(wayId) : false;
            return {
              color: isBlocked ? "#ef4444" : "#93c5fd",
              weight: isBlocked ? 3 : 1.5,
              opacity: isBlocked ? 0.9 : 0.15
            };
          }}
          eventHandlers={{
            click: (ev: any) => {
              if (tool !== "blocked") return;
              const wayId = ev?.layer?.feature?.properties?.wayId as string | undefined;
              if (wayId) toggleBlockedWay(wayId);
            }
          }}
        />
      ) : null}

      {showHazards
        ? hazards.map((h) => (
            <Circle
              key={h.id}
              center={[h.center.lat, h.center.lon]}
              radius={h.radiusMeters}
              pathOptions={{
                color: "#fb7185",
                fillColor: "#fb7185",
                fillOpacity: 0.12,
                opacity: h.enabled ? 0.9 : 0.2,
                weight: 2
              }}
            />
          ))
        : null}

      {startLLs.map((ll, i) => <Marker key={i} position={ll} icon={StartIcon} />)}
      {goalLL ? <Marker position={goalLL} icon={GoalIcon} /> : null}

      {showExplored && lastRun ? (
        <LeafletCanvasOverlay graph={graph} nodeIds={visitedNodeIds} color="rgba(167,139,250,0.6)" radiusPx={1.5} opacity={1} />
      ) : null}

      {showPath && paths.length > 0 ? (
        <>
          {paths.map((p, i) => (
            <Polyline key={i} positions={p.latlngs} pathOptions={{ color: "#34d399", weight: 4, opacity: 0.8, lineJoin: 'round' }} />
          ))}
        </>
      ) : null}
    </MapContainer>
  );
}
