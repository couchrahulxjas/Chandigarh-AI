/**
 * Convert Overpass JSON -> road GeoJSON + weighted graph JSON.
 *
 * Input:
 * - public/data/chandigarh-overpass.json
 *
 * Output:
 * - public/data/chandigarh-roads.geojson
 * - public/data/chandigarh-graph.json
 *
 * Graph format:
 * - nodes: [{id, lat, lon}]
 * - adj: per-node edges with {to, distMeters, key, mid}
 * - ways: wayId -> edgeKeys[] (for fast "block road" UX)
 */
import fs from "node:fs";
import path from "node:path";

const IN = path.resolve("public/data/chandigarh-overpass.json");
const OUT_ROADS = path.resolve("public/data/chandigarh-roads.geojson");
const OUT_GRAPH = path.resolve("public/data/chandigarh-graph.json");

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function haversineMeters(a, b) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

function edgeKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function mustLoad() {
  if (!fs.existsSync(IN)) throw new Error(`Missing ${IN}. Run: npm run fetch:chandigarh`);
  return JSON.parse(fs.readFileSync(IN, "utf-8"));
}

function isDrivableHighway(tags) {
  const hw = tags?.highway;
  if (!hw) return false;
  const blocked = new Set([
    "footway",
    "path",
    "steps",
    "cycleway",
    "bridleway",
    "corridor",
    "construction",
    "proposed",
    "service"
  ]);
  return !blocked.has(hw);
}

const raw = mustLoad();
const nodeById = new Map();
for (const el of raw.elements) {
  if (el.type === "node") nodeById.set(el.id, { lat: el.lat, lon: el.lon });
}

const usedNodeIds = new Set();
const ways = raw.elements.filter(
  (e) => e.type === "way" && isDrivableHighway(e.tags) && Array.isArray(e.nodes) && e.nodes.length > 1
);
for (const w of ways) for (const nid of w.nodes) usedNodeIds.add(nid);

const nodeIds = Array.from(usedNodeIds);
nodeIds.sort((a, b) => a - b);
const idxByOsmId = new Map(nodeIds.map((id, i) => [id, i]));

const nodes = nodeIds.map((osmId, id) => {
  const n = nodeById.get(osmId);
  return { id, lat: n.lat, lon: n.lon };
});

const adj = Array.from({ length: nodes.length }, () => []);
const wayEdges = {};
const features = [];

for (const w of ways) {
  const coords = [];
  const edgeKeys = [];
  for (let i = 0; i < w.nodes.length; i++) {
    const osmNodeId = w.nodes[i];
    const idx = idxByOsmId.get(osmNodeId);
    if (idx === undefined) continue;
    coords.push([nodes[idx].lon, nodes[idx].lat]);
    if (i === 0) continue;
    const prevIdx = idxByOsmId.get(w.nodes[i - 1]);
    if (prevIdx === undefined) continue;
    const A = nodes[prevIdx];
    const B = nodes[idx];
    const dist = haversineMeters({ lat: A.lat, lon: A.lon }, { lat: B.lat, lon: B.lon });
    const key = edgeKey(prevIdx, idx);
    edgeKeys.push(key);
    const mid = { lat: (A.lat + B.lat) / 2, lon: (A.lon + B.lon) / 2 };
    adj[prevIdx].push({ to: idx, distMeters: dist, key, mid });
    adj[idx].push({ to: prevIdx, distMeters: dist, key, mid });
  }
  if (coords.length < 2) continue;
  const wayId = String(w.id);
  wayEdges[wayId] = edgeKeys;
  features.push({
    type: "Feature",
    properties: { wayId, highway: w.tags.highway, name: w.tags.name ?? null },
    geometry: { type: "LineString", coordinates: coords }
  });
}

fs.mkdirSync(path.dirname(OUT_ROADS), { recursive: true });
fs.writeFileSync(OUT_ROADS, JSON.stringify({ type: "FeatureCollection", features }));
fs.writeFileSync(OUT_GRAPH, JSON.stringify({ nodes, adj, ways: wayEdges }));
console.log(`Wrote ${OUT_ROADS}`);
console.log(`Wrote ${OUT_GRAPH}`);

