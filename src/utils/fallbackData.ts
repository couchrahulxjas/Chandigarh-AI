import type { GraphData } from "../state/types";
import { edgeKey, haversineMeters } from "./geo";

// Tiny fallback graph around Chandigarh center (demo-only).
// For real OSM routing, run `npm run fetch:chandigarh` then `npm run build:graph`.
const NODES: Array<{ lat: number; lon: number }> = [
  { lat: 30.7333, lon: 76.7794 }, // 0
  { lat: 30.7355, lon: 76.789 }, // 1
  { lat: 30.7395, lon: 76.799 }, // 2
  { lat: 30.726, lon: 76.7885 }, // 3
  { lat: 30.723, lon: 76.8 }, // 4
  { lat: 30.7445, lon: 76.7705 }, // 5
  { lat: 30.75, lon: 76.784 } // 6
];

const LINKS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [1, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 2],
  [6, 1],
  [6, 0]
];

function build(): GraphData {
  const nodes = NODES.map((n, id) => ({ id, ...n }));
  const adj: any[][] = Array.from({ length: nodes.length }, () => []);
  for (const [a, b] of LINKS) {
    const A = nodes[a];
    const B = nodes[b];
    const dist = haversineMeters({ lat: A.lat, lon: A.lon }, { lat: B.lat, lon: B.lon });
    const key = edgeKey(a, b);
    const mid = { lat: (A.lat + B.lat) / 2, lon: (A.lon + B.lon) / 2 };
    adj[a].push({ to: b, distMeters: dist, key, mid });
    adj[b].push({ to: a, distMeters: dist, key, mid });
  }
  return { nodes, adj, ways: {} };
}

export const fallbackGraphData = build();

export const fallbackRoadsGeojson: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: LINKS.map(([a, b], i) => {
    const A = NODES[a];
    const B = NODES[b];
    return {
      type: "Feature",
      properties: { wayId: `fallback-${i}` },
      geometry: {
        type: "LineString",
        coordinates: [
          [A.lon, A.lat],
          [B.lon, B.lat]
        ]
      }
    };
  })
};

