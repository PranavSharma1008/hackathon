import React, { useState } from 'react';
import { MapPin, Navigation, Compass, Layers, Info, CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * Interactive Agronomic Geospatial Map Component
 * Visualizes the processor hub and candidate farm locations with distance radius rings.
 */
export default function AgriMap({ processor, matches = [], selectedFarmId, onSelectFarm }) {
  const [hoveredFarm, setHoveredFarm] = useState(null);

  if (!processor || !processor.location) {
    return (
      <div className="h-80 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-xs">
        No geographic location coordinates available
      </div>
    );
  }

  const centerLat = processor.location.latitude;
  const centerLng = processor.location.longitude;
  const maxRadiusKm = processor.max_distance_km || 100;

  // Compute map bounds with padding
  const allPoints = [
    { lat: centerLat, lng: centerLng },
    ...matches.map((m) => ({ lat: m.location.latitude, lng: m.location.longitude })),
  ];

  const lats = allPoints.map((p) => p.lat);
  const lngs = allPoints.map((p) => p.lng);

  const minLat = Math.min(...lats) - 0.15;
  const maxLat = Math.max(...lats) + 0.15;
  const minLng = Math.min(...lngs) - 0.2;
  const maxLng = Math.max(...lngs) + 0.2;

  // Map projection helpers into 600x400 SVG space
  const svgWidth = 600;
  const svgHeight = 420;
  const padding = 50;

  function toSvgCoords(lat, lng) {
    const x = padding + ((lng - minLng) / (maxLng - minLng)) * (svgWidth - 2 * padding);
    // Invert Y because latitude goes north (up) but SVG Y goes down
    const y = svgHeight - padding - ((lat - minLat) / (maxLat - minLat)) * (svgHeight - 2 * padding);
    return { x: Math.max(padding, Math.min(svgWidth - padding, x)), y: Math.max(padding, Math.min(svgHeight - padding, y)) };
  }

  const hubPos = toSvgCoords(centerLat, centerLng);

  // Approximate pixel radius for maxDistanceKm
  // 1 degree latitude ~ 111 km
  const kmPerLatDegree = 111;
  const latSpanKm = (maxLat - minLat) * kmPerLatDegree;
  const pxPerKm = (svgHeight - 2 * padding) / Math.max(1, latSpanKm);
  const radiusPx = Math.min(svgWidth * 0.42, Math.max(60, maxRadiusKm * pxPerKm));

  return (
    <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl text-white relative overflow-hidden">
      {/* Map Header */}
      <div className="flex items-center justify-between mb-3 z-10 relative">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              Geospatial Agronomic Radar
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">
                LIVE GEO-PLOT
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Center: {processor.company_name} &bull; Max Radius: {maxRadiusKm} km
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            <span>Optimal (85%+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-xs shadow-amber-400/50" />
            <span>Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Out of Radius</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full rounded-xl bg-slate-950/80 border border-slate-800 overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[380px] select-none"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
            </pattern>
            {/* Radar Radial Gradient */}
            <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
              <stop offset="70%" stopColor="#10b981" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Grid */}
          <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

          {/* Concentric Distance Rings */}
          <circle
            cx={hubPos.x}
            cy={hubPos.y}
            r={radiusPx * 0.33}
            fill="none"
            stroke="rgba(16, 185, 129, 0.15)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text
            x={hubPos.x + radiusPx * 0.33 + 4}
            y={hubPos.y - 4}
            fill="rgba(16, 185, 129, 0.4)"
            fontSize="9"
            fontFamily="monospace"
          >
            {Math.round(maxRadiusKm * 0.33)}km
          </text>

          <circle
            cx={hubPos.x}
            cy={hubPos.y}
            r={radiusPx * 0.66}
            fill="none"
            stroke="rgba(16, 185, 129, 0.15)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text
            x={hubPos.x + radiusPx * 0.66 + 4}
            y={hubPos.y - 4}
            fill="rgba(16, 185, 129, 0.4)"
            fontSize="9"
            fontFamily="monospace"
          >
            {Math.round(maxRadiusKm * 0.66)}km
          </text>

          {/* Max Distance Boundary Circle */}
          <circle
            cx={hubPos.x}
            cy={hubPos.y}
            r={radiusPx}
            fill="url(#radarGlow)"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeOpacity="0.5"
            strokeDasharray="6 3"
          />
          <text
            x={hubPos.x + radiusPx - 15}
            y={hubPos.y - 6}
            fill="#10b981"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {maxRadiusKm}km Limit
          </text>

          {/* Lines from Processor to Farms */}
          {matches.map((farm) => {
            const pos = toSvgCoords(farm.location.latitude, farm.location.longitude);
            const isSelected = selectedFarmId === farm.farmer_id;
            const isHovered = hoveredFarm?.farmer_id === farm.farmer_id;

            let strokeColor = 'rgba(148, 163, 184, 0.15)';
            if (farm.compatibility_score >= 85) strokeColor = 'rgba(16, 185, 129, 0.3)';
            if (isSelected || isHovered) strokeColor = '#34d399';

            return (
              <line
                key={`line-${farm.farmer_id}`}
                x1={hubPos.x}
                y1={hubPos.y}
                x2={pos.x}
                y2={pos.y}
                stroke={strokeColor}
                strokeWidth={isSelected || isHovered ? 2 : 1}
                strokeDasharray={farm.is_within_radius ? 'none' : '3 3'}
              />
            );
          })}

          {/* Farm Markers */}
          {matches.map((farm) => {
            const pos = toSvgCoords(farm.location.latitude, farm.location.longitude);
            const isSelected = selectedFarmId === farm.farmer_id;
            const isHovered = hoveredFarm?.farmer_id === farm.farmer_id;

            let pinColor = '#f59e0b'; // amber
            if (farm.compatibility_score >= 85) pinColor = '#10b981'; // emerald
            if (!farm.is_within_radius) pinColor = '#f43f5e'; // rose

            return (
              <g
                key={`farm-${farm.farmer_id}`}
                className="cursor-pointer transition-transform"
                onClick={() => onSelectFarm && onSelectFarm(farm)}
                onMouseEnter={() => setHoveredFarm(farm)}
                onMouseLeave={() => setHoveredFarm(null)}
              >
                {/* Glow ring if selected or hovered */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="18"
                    fill={pinColor}
                    fillOpacity="0.25"
                    className="animate-ping"
                  />
                )}

                {/* Outer Pin Circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isSelected || isHovered ? 12 : 9}
                  fill={pinColor}
                  stroke="#0f172a"
                  strokeWidth="2"
                  className="transition-all"
                />

                {/* Rank Number Inside Pin */}
                <text
                  x={pos.x}
                  y={pos.y + 3.5}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={isSelected || isHovered ? "10" : "8"}
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {farm.rank}
                </text>

                {/* Farm Name Label */}
                <text
                  x={pos.x}
                  y={pos.y + (isSelected || isHovered ? 24 : 18)}
                  textAnchor="middle"
                  fill={isSelected || isHovered ? '#ffffff' : '#94a3b8'}
                  fontSize={isSelected || isHovered ? "10" : "8"}
                  fontWeight={isSelected || isHovered ? "bold" : "normal"}
                >
                  {farm.farmer_name.split(' ')[0]} ({farm.compatibility_score}%)
                </text>
              </g>
            );
          })}

          {/* Central Processor Hub Marker */}
          <g>
            <circle
              cx={hubPos.x}
              cy={hubPos.y}
              r="18"
              fill="#3b82f6"
              fillOpacity="0.2"
              className="animate-pulse"
            />
            <circle
              cx={hubPos.x}
              cy={hubPos.y}
              r="11"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            <circle
              cx={hubPos.x}
              cy={hubPos.y}
              r="4"
              fill="#ffffff"
            />
            <text
              x={hubPos.x}
              y={hubPos.y - 16}
              textAnchor="middle"
              fill="#60a5fa"
              fontSize="11"
              fontWeight="bold"
            >
              🏭 {processor.company_name}
            </text>
          </g>
        </svg>

        {/* Hovered Farm Floating Tooltip Card */}
        {hoveredFarm && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-xs bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-3 shadow-2xl z-20 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  #{hoveredFarm.rank}
                </span>
                {hoveredFarm.farmer_name}
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                {hoveredFarm.compatibility_score}% Match
              </span>
            </div>
            <div className="text-[11px] text-slate-300 space-y-0.5">
              <div>📍 {hoveredFarm.distance_km} km away {hoveredFarm.is_within_radius ? '(Within Radius)' : '⚠️ (Exceeds Limit)'}</div>
              <div>🌱 Soil: <strong className="text-emerald-400">{hoveredFarm.soil_type}</strong> &bull; Size: <strong>{hoveredFarm.total_acreage} Acres</strong></div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
        <span>Click any numbered farm marker on the radar to inspect or initiate contract matching</span>
        <span className="font-mono text-emerald-400 font-semibold">{matches.length} Farms Plotted</span>
      </div>
    </div>
  );
}
