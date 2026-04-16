import { useEffect, useMemo, useRef } from "react";
import { useMap } from "react-leaflet";
import type { GraphData } from "../state/types";

type Props = {
  graph: GraphData;
  nodeIds: number[];
  color: string;
  radiusPx: number;
  opacity: number;
};

export function LeafletCanvasOverlay({ graph, nodeIds, color, radiusPx, opacity }: Props) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const container = useMemo(() => map.getContainer(), [map]);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.opacity = String(opacity);
    canvasRef.current = canvas;
    container.appendChild(canvas);

    const resize = () => {
      const r = container.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(r.width));
      canvas.height = Math.max(1, Math.floor(r.height));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    return () => {
      ro.disconnect();
      canvas.remove();
    };
  }, [container, opacity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      for (const id of nodeIds) {
        const n = graph.nodes[id];
        const p = map.latLngToContainerPoint([n.lat, n.lon]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radiusPx, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    draw();
    map.on("move", draw);
    map.on("zoom", draw);
    return () => {
      map.off("move", draw);
      map.off("zoom", draw);
    };
  }, [map, graph, nodeIds, color, radiusPx]);

  return null;
}

