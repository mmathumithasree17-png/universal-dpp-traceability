import React, { useState } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';

export default function ProductsTimelineChart({ data = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs font-mono text-slate-500">
        <TrendingUp className="w-8 h-8 text-slate-600 mb-2" />
        No timeline telemetry recorded yet.
      </div>
    );
  }

  // Calculate scaling for SVG
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 120;
  const chartWidth = 400;
  const paddingX = 40;
  const paddingY = 20;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  // Generate coordinate points
  const points = data.map((d, i) => {
    const x = data.length === 1 
      ? chartWidth / 2 
      : paddingX + (i / (data.length - 1)) * innerWidth;
    const y = chartHeight - paddingY - (d.count / (maxCount * 1.2)) * innerHeight;
    return { x, y, ...d };
  });

  const pathD = points.length === 1
    ? `M ${points[0].x - 20} ${points[0].y} L ${points[0].x + 20} ${points[0].y}`
    : points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');

  const areaD = points.length === 1
    ? ''
    : `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-cyan-600" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
            Manufacturing Timeline (Motors Built)
          </h3>
        </div>
        <span className="text-[11px] font-mono text-cyan-700 font-semibold">
          Peak: {maxCount} units/day
        </span>
      </div>

      <div className="relative bg-slate-50 rounded-xl p-3 border border-slate-200">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-36 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="cyanAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="cyanLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={chartWidth - paddingX}
            y2={paddingY}
            stroke="#cbd5e1"
            strokeDasharray="3 3"
          />
          <line
            x1={paddingX}
            y1={chartHeight / 2}
            x2={chartWidth - paddingX}
            y2={chartHeight / 2}
            stroke="#cbd5e1"
            strokeDasharray="3 3"
          />
          <line
            x1={paddingX}
            y1={chartHeight - paddingY}
            x2={chartWidth - paddingX}
            y2={chartHeight - paddingY}
            stroke="#94a3b8"
          />

          {/* Area fill */}
          {areaD && <path d={areaD} fill="url(#cyanAreaGradient)" />}

          {/* Main Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#cyanLineGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data points */}
          {points.map((pt, i) => (
            <g key={i}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === i ? '6' : '4'}
                fill="#0284c7"
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </g>
          ))}
        </svg>

        {/* Hover Tooltip display */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute top-2 right-4 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-[11px] font-mono shadow-lg text-cyan-300 pointer-events-none"
          >
            <strong>{points[hoveredIndex].formattedDate}</strong>: {points[hoveredIndex].count} motor(s) completed
          </div>
        )}

        {/* X-axis labels */}
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2 px-6">
          {points.map((pt, i) => (
            <span key={i} className="truncate">
              {pt.formattedDate}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
