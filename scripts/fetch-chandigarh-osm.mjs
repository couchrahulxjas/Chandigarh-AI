/**
 * Fetch raw OSM road data via Overpass and save it for offline preprocessing.
 *
 * Output:
 * - public/data/chandigarh-overpass.json
 *
 * Requires internet access. Overpass can rate-limit; retry if needed.
 */
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("public/data/chandigarh-overpass.json");

// Chandigarh bounding box (approx): south, west, north, east
const BBOX = "30.66,76.70,30.79,76.87";

const query = `
[out:json][timeout:180];
(
  way["highway"](${BBOX});
);
(._;>;);
out body;
`;

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://z.overpass-api.de/api/interpreter"
];

async function fetchWithRetry() {
  for (const url of ENDPOINTS) {
    console.log(`Trying Overpass endpoint: ${url}...`);
    try {
      const res = await fetch(url, {
        method: "POST",
        body: query,
        headers: { "content-type": "text/plain" },
        signal: AbortSignal.timeout(60000) // 60s per attempt
      });
      if (res.ok) {
        return await res.json();
      }
      console.warn(`Endpoint ${url} failed with ${res.status}`);
    } catch (err) {
      console.warn(`Endpoint ${url} failed: ${err.message}`);
    }
  }
  throw new Error("All Overpass endpoints failed.");
}

console.log("Fetching Overpass data for Chandigarh...");
const json = await fetchWithRetry();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(json));
console.log(`Saved ${OUT}`);

