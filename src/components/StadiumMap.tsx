import React from "react";
import { STADIUM_NODES, NavNode } from "../types";
import { Compass, ShieldAlert, Award, Star, Info, Accessibility, Bus, Shield } from "lucide-react";

interface StadiumMapProps {
  currentLevel: 1 | 2;
  setCurrentLevel: (lvl: 1 | 2) => void;
  selectedStartNodeId: string;
  selectedEndNodeId: string;
  onSelectNode: (nodeId: string) => void;
  activePathPoints: [number, number][] | null;
  gateLoads: Record<string, number>; // Load percentages per sector
  activeIncidents: Array<{ id: string; location: string; severity: string }>;
  role: "fan" | "ops" | "volunteer";
  onSectorClick?: (sectorName: string) => void;
}

export const StadiumMap: React.FC<StadiumMapProps> = ({
  currentLevel,
  setCurrentLevel,
  selectedStartNodeId,
  selectedEndNodeId,
  onSelectNode,
  activePathPoints,
  gateLoads,
  activeIncidents,
  role,
  onSectorClick
}) => {
  // Stadium Center
  const cx = 400;
  const cy = 350;

  // Render pins for the current level
  const nodesToRender = STADIUM_NODES.filter(n => n.level === currentLevel);

  // Helper to color node pins
  const getNodeColor = (node: NavNode) => {
    if (node.id === selectedStartNodeId) return "fill-emerald-500 stroke-emerald-100 ring-4 ring-emerald-400";
    if (node.id === selectedEndNodeId) return "fill-amber-500 stroke-amber-100 ring-4 ring-amber-400";

    switch (node.type) {
      case "entrance":
        return "fill-blue-500 stroke-blue-200";
      case "transport":
        return "fill-indigo-500 stroke-indigo-200";
      case "amenity":
        return "fill-green-600 stroke-green-200";
      case "section":
        return "fill-slate-600 stroke-slate-300";
      default:
        return "fill-slate-400 stroke-white";
    }
  };

  // Helper to check if node is in active incident location
  const hasIncident = (nodeName: string) => {
    return activeIncidents.some(inc => 
      nodeName.toLowerCase().includes(inc.location.toLowerCase()) ||
      inc.location.toLowerCase().includes(nodeName.toLowerCase())
    );
  };

  // Sector coordinates for seating heatmap overlays
  // Quarters of the oval ring
  // Outer oval: rx=320, ry=260
  // Inner oval (around pitch): rx=160, ry=110
  const renderSectorsHeatmap = () => {
    const sectors = [
      { id: "north", name: "North Stand", d: "M 200,150 A 240,180 0 0,1 600,150 L 520,240 A 150,110 0 0,0 280,240 Z" },
      { id: "east", name: "East Stand (Grandstands)", d: "M 600,150 A 240,180 0 0,1 600,550 L 520,460 A 150,110 0 0,0 520,240 Z" },
      { id: "south", name: "South Stand", d: "M 600,550 A 240,180 0 0,1 200,550 L 280,460 A 150,110 0 0,0 520,460 Z" },
      { id: "west", name: "West Stand (Main Deck)", d: "M 200,550 A 240,180 0 0,1 200,150 L 280,240 A 150,110 0 0,0 280,460 Z" }
    ];

    return sectors.map(sec => {
      const load = gateLoads[sec.id] || 40;
      let fillOpacity = 0.25;
      let strokeColor = "rgba(255,255,255,0.15)";
      let fillColor = "rgba(16, 185, 129, 0.4)"; // Safe Green

      if (load > 85) {
        fillColor = "rgba(239, 68, 68, 0.75)"; // Danger Red
        fillOpacity = 0.5;
        strokeColor = "rgba(239, 68, 68, 0.9)";
      } else if (load > 60) {
        fillColor = "rgba(245, 158, 11, 0.55)"; // Warning Orange
        fillOpacity = 0.4;
        strokeColor = "rgba(245, 158, 11, 0.7)";
      }

      return (
        <g 
          key={sec.id} 
          className="cursor-pointer group"
          onClick={() => onSectorClick && onSectorClick(sec.name)}
        >
          <path
            d={sec.d}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth="2"
            className="transition-all duration-500 hover:fill-opacity-65"
          />
          <title>{`${sec.name}: ${load}% Capacity`}</title>
        </g>
      );
    });
  };

  return (
    <div className="relative w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden p-6 shadow-xl">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-widest opacity-60 flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-500 animate-spin-slow" />
            Predictive Crowd Density & Live Map
          </h4>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Interactive view of concourses, seating tiers, and amenities.
          </p>
        </div>

        {/* Level Switcher */}
        <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setCurrentLevel(1)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              currentLevel === 1 
                ? "bg-blue-600 text-white shadow-md" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Level 1: Concourse
          </button>
          <button
            onClick={() => setCurrentLevel(2)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              currentLevel === 2 
                ? "bg-blue-600 text-white shadow-md" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            Level 2: Upper Tier
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative aspect-[4/3] w-full bg-slate-950/40 rounded-2xl overflow-hidden border border-slate-950">
        <svg 
          viewBox="0 0 800 700" 
          className="w-full h-full select-none"
        >
          <defs>
            {/* Glow filters for paths */}
            <filter id="glow-route" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Radial Gradient for stadium field */}
            <radialGradient id="fieldGrad" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="100%" stopColor="#14532d" />
            </radialGradient>
          </defs>

          {/* Outer Stadium Structure Outline */}
          <ellipse 
            cx={cx} 
            cy={cy} 
            rx="380" 
            ry="310" 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="6" 
          />
          <ellipse 
            cx={cx} 
            cy={cy} 
            rx="350" 
            ry="290" 
            fill="none" 
            stroke="#334155" 
            strokeWidth="2" 
            strokeDasharray="10, 5" 
          />

          {/* Crowd Heatmap Overlay for Seating sectors */}
          {renderSectorsHeatmap()}

          {/* Stadium Inner Field (The Pitch) */}
          <g>
            {/* Pitch Grass Area */}
            <rect 
              x="260" 
              y="230" 
              width="280" 
              height="240" 
              rx="6" 
              fill="url(#fieldGrad)" 
              stroke="#22c55e" 
              strokeWidth="3" 
            />
            {/* Field Lines */}
            <line x1="400" y1="230" x2="400" y2="470" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <circle cx="400" cy="350" r="45" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <circle cx="400" cy="350" r="3" fill="rgba(255,255,255,0.8)" />
            {/* Penalty Boxes */}
            <rect x="260" y="300" width="35" height="100" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            <rect x="505" y="300" width="35" height="100" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
            {/* Corner Arcs */}
            <path d="M 260,235 A 5,5 0 0,0 265,230" fill="none" stroke="rgba(255,255,255,0.4)" />
            <path d="M 540,235 A 5,5 0 0,1 535,230" fill="none" stroke="rgba(255,255,255,0.4)" />
            <path d="M 260,465 A 5,5 0 0,1 265,470" fill="none" stroke="rgba(255,255,255,0.4)" />
            <path d="M 540,465 A 5,5 0 0,0 535,470" fill="none" stroke="rgba(255,255,255,0.4)" />
          </g>

          {/* Concourse Pathways / Walkways */}
          <ellipse 
            cx={cx} 
            cy={cy} 
            rx="210" 
            ry="160" 
            fill="none" 
            stroke="#0f172a" 
            strokeWidth="30" 
            strokeOpacity="0.7" 
          />
          <ellipse 
            cx={cx} 
            cy={cy} 
            rx="210" 
            ry="160" 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="1.5" 
            strokeDasharray="4, 12" 
            strokeOpacity="0.4"
          />

          {/* Glow Active Path Navigation Route */}
          {activePathPoints && activePathPoints.length > 1 && (
            <g>
              {/* Glow backdrop line */}
              <polyline
                points={activePathPoints.map(p => p.join(",")).join(" ")}
                fill="none"
                stroke="#dfa82d"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow-route)"
                opacity="0.85"
                className="animate-pulse"
              />
              {/* Dynamic pulsing dashed foreground line */}
              <polyline
                points={activePathPoints.map(p => p.join(",")).join(" ")}
                fill="none"
                stroke="#fff"
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="12, 12"
                className="animated-route-path"
              />
            </g>
          )}

          {/* Render Pin Nodes */}
          {nodesToRender.map(node => {
            const hasAlert = hasIncident(node.name);
            const isStart = node.id === selectedStartNodeId;
            const isEnd = node.id === selectedEndNodeId;

            return (
              <g 
                key={node.id} 
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer group transition-transform duration-300 hover:scale-125"
                onClick={() => onSelectNode(node.id)}
              >
                {/* Ping animation for alerts or start/end nodes */}
                {(hasAlert || isStart || isEnd) && (
                  <circle
                    r="20"
                    fill="none"
                    stroke={hasAlert ? "#ef4444" : isStart ? "#10b981" : "#f59e0b"}
                    strokeWidth="2"
                    className="animate-ping opacity-75"
                  />
                )}

                {/* Pin Circle Backdrop */}
                <circle
                  r={isStart || isEnd ? "14" : "11"}
                  className={`transition-colors duration-300 ${getNodeColor(node)}`}
                  strokeWidth="2"
                  filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.5))"
                />

                {/* Mini icon representations on map */}
                {isStart ? (
                  <text y="4" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">S</text>
                ) : isEnd ? (
                  <text y="4" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">E</text>
                ) : node.type === "entrance" ? (
                  <circle r="4" fill="#fff" />
                ) : node.type === "amenity" ? (
                  <circle r="3.5" fill="#f8fafc" />
                ) : (
                  <circle r="2" fill="#e2e8f0" />
                )}

                {/* Tooltip Overlay */}
                <g className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                  <rect
                    x="-65"
                    y="-36"
                    width="130"
                    height="20"
                    rx="4"
                    fill="#1e293b"
                    stroke="#475569"
                    strokeWidth="1"
                  />
                  <text
                    y="-22"
                    textAnchor="middle"
                    fill="#fff"
                    fontSize="9"
                    fontWeight="500"
                  >
                    {node.name.length > 20 ? node.name.slice(0, 18) + "..." : node.name}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Floating Controls Overlay */}
        <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 bg-slate-900/95 border border-slate-800/90 backdrop-blur-md p-3 rounded-xl shadow-xl max-w-[260px]">
          <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
            Map Legend
          </h5>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] text-slate-300 font-mono">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              <span>Gate Entrance</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
              <span>Transit Hub</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-600 inline-block" />
              <span>Food/Store</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
              <span>Seat Sector</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Selected Start</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <span>Selected End</span>
            </div>
          </div>
        </div>

        {/* Evacuation Alert Alert overlay */}
        {activeIncidents.some(inc => inc.severity === "critical") && (
          <div className="absolute top-3 left-3 bg-red-950/90 border border-red-800 backdrop-blur p-2 px-3 rounded-lg flex items-center gap-2 animate-bounce">
            <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="text-[10px] text-red-200 font-semibold uppercase tracking-wider">
              Critical Alerts Active
            </span>
          </div>
        )}
      </div>

      {/* Embedded CSS styling for the polyline animated pulse route */}
      <style>{`
        .animated-route-path {
          stroke-dasharray: 15, 12;
          animation: dashroute 25s linear infinite;
        }
        @keyframes dashroute {
          to {
            stroke-dashoffset: -1000;
          }
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
