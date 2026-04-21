import { useEffect, useRef } from "react";

interface GraphPoint {
  timestamp: number;
  value: number;
}

interface SerialGraphProps {
  data: GraphPoint[];
}

export default function SerialGraph({ data }: SerialGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    if (data.length < 2) {
      ctx.fillStyle = "#4b5563";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("En attente de données numériques...", width / 2, height / 2);
      return;
    }

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const pad = { top: 12, bottom: 20, left: 40, right: 12 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    // Grid
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 1;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = pad.top + (plotH * i) / gridLines;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();

      // Y axis labels
      const val = max - (range * i) / gridLines;
      ctx.fillStyle = "#6b7280";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(val.toFixed(1), pad.left - 4, y + 3);
    }

    // X axis
    ctx.strokeStyle = "#374151";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top + plotH);
    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.stroke();

    // Line
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();

    data.forEach((point, i) => {
      const x = pad.left + (plotW * i) / (data.length - 1);
      const y = pad.top + plotH - (plotH * (point.value - min)) / range;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + plotH);
    gradient.addColorStop(0, "rgba(59,130,246,0.15)");
    gradient.addColorStop(1, "rgba(59,130,246,0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();

    data.forEach((point, i) => {
      const x = pad.left + (plotW * i) / (data.length - 1);
      const y = pad.top + plotH - (plotH * (point.value - min)) / range;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.lineTo(pad.left + plotW, pad.top + plotH);
    ctx.lineTo(pad.left, pad.top + plotH);
    ctx.closePath();
    ctx.fill();

    // Last value dot
    const lastPoint = data[data.length - 1];
    const lastX = pad.left + plotW;
    const lastY = pad.top + plotH - (plotH * (lastPoint.value - min)) / range;

    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Last value label
    ctx.fillStyle = "#93c5fd";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(lastPoint.value.toFixed(2), lastX - 35, lastY - 8);
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={160}
      className="w-full h-full"
      style={{ display: "block" }}
    />
  );
}
