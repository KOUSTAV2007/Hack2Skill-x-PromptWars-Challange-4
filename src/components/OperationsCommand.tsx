import React, { useState } from "react";
import { Incident, Gate } from "../types";
import { 
  ShieldAlert, Send, Loader2, Volume2, ShieldCheck, 
  Users, Check, ToggleLeft, HelpCircle, Activity, Play, RefreshCw, Flame
} from "lucide-react";

interface OperationsCommandProps {
  incidents: Incident[];
  onAddIncident: (incident: Incident) => void;
  onResolveIncident: (id: string) => void;
  gates: Gate[];
  onUpdateGate: (gateId: string, updates: Partial<Gate>) => void;
  sectorLoads: Record<string, number>;
  onUpdateSectorLoad: (sectorId: string, load: number) => void;
  onTriggerPreset: (preset: "kickoff" | "exodus" | "clear") => void;
}

export const OperationsCommand: React.FC<OperationsCommandProps> = ({
  incidents,
  onAddIncident,
  onResolveIncident,
  gates,
  onUpdateGate,
  sectorLoads,
  onUpdateSectorLoad,
  onTriggerPreset
}) => {
  // Incident Form State
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("Shift Supervisor");
  const [reportedLocation, setReportedLocation] = useState("Gate B (South Entrance)");
  const [isDispatching, setIsDispatching] = useState(false);

  // Active Selected Incident for SOP display
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    incidents.length > 0 ? incidents[0].id : null
  );

  const activeIncident = incidents.find(i => i.id === selectedIncidentId) || incidents[0];

  // Call Dispatch API
  const handleDispatchSOP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsDispatching(true);

    try {
      const response = await fetch("/api/ops/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          context: {
            reportedLocation,
            activeGates: gates.map(g => ({ name: g.name, status: g.status, wait: g.estimatedWaitTime })),
            sectorLoads
          }
        })
      });

      const data = await response.json();
      if (data && data.severity) {
        // Create new dynamic incident item
        const newIncident: Incident = {
          id: `inc-${Date.now()}`,
          summary: data.alertSummary || "Unclassified Safety Alert",
          category: data.category || "General Safety",
          severity: data.severity,
          location: reportedLocation,
          reportedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: "active",
          sopSteps: data.sopSteps,
          volunteerBriefing: data.volunteerBriefing,
          paAnnouncement: data.paAnnouncement,
          reporter: reporterName
        };

        onAddIncident(newIncident);
        setSelectedIncidentId(newIncident.id);
        
        // Reset description form
        setDescription("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* COLUMN 1: NEW INCIDENT DISPATCH FORM & PRESETS */}
      <div className="flex flex-col gap-6 lg:col-span-1">
        
        {/* Incident Reporter & GenAI SOP Trigger */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="p-1.5 bg-red-50 text-red-500 rounded-lg">
              <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
            </span>
            AI Incident Dispatch
          </h3>
          <p className="text-xs text-slate-700 font-semibold mb-4">
            Type or voice-log a stadium issue (e.g., slip, fire hazard, elevator malfunction) to generate standard operating protocols instantly via Gemini.
          </p>

          <form onSubmit={handleDispatchSOP} className="space-y-4">
            <div>
              <label htmlFor="reporter-name" className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Reporter Name / Role
              </label>
              <input
                id="reporter-name"
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-600"
                required
              />
            </div>

            <div>
              <label htmlFor="reported-location" className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Stadium Sector Location
              </label>
              <select
                id="reported-location"
                value={reportedLocation}
                onChange={(e) => setReportedLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-600"
              >
                <option value="Gate A (Main Entrance)">Gate A (Main Entrance)</option>
                <option value="Gate B (South Entrance)">Gate B (South Entrance)</option>
                <option value="Gate C (West Entrance)">Gate C (West Entrance)</option>
                <option value="Gate D (North Entrance)">Gate D (North Entrance)</option>
                <option value="Section 115 Seating">Section 115 Seating</option>
                <option value="Section 101 Seating">Section 101 Seating</option>
                <option value="Eco-Eats Food Court">Eco-Eats Food Court</option>
                <option value="Medical Center 104">Medical Center 104</option>
              </select>
            </div>

            <div>
              <label htmlFor="incident-description" className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Describe the Incident
              </label>
              <textarea
                id="incident-description"
                placeholder="What occurred? (e.g. 'A small kitchen smoke alert triggered in Concession 4, fans panic-exiting Section 102')"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-600 placeholder-slate-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isDispatching || !description.trim()}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-100 text-white font-bold rounded-xl py-3.5 px-4 transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-100"
            >
              {isDispatching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating SOP Action Plan...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Run AI SOP Protocol
                </>
              )}
            </button>
          </form>
        </div>

        {/* Dynamic Simulation Controls (Presets) */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Activity className="w-4 h-4 text-emerald-600" />
            </span>
            Crowd Simulation Presets
          </h3>
          <p className="text-xs text-slate-500 font-medium mb-4">
            Test and stress-test operations with stadium presets to view simulated wait times and evac thresholds.
          </p>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => onTriggerPreset("kickoff")}
              className="flex items-center justify-between bg-slate-55 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-2xl p-3.5 text-left transition cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block">⚽ Pre-Kickoff Inflow Rush</span>
                <span className="text-[10px] text-slate-500 font-medium block">Open all gates, peak wait times at entrances</span>
              </div>
              <Play className="w-4 h-4 text-emerald-600" />
            </button>

            <button
              onClick={() => onTriggerPreset("exodus")}
              className="flex items-center justify-between bg-slate-55 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-2xl p-3.5 text-left transition cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block">🚨 Final Whistle Exodus</span>
                <span className="text-[10px] text-slate-500 font-medium block">Set gates to EXIT-ONLY, clear concourse corridors</span>
              </div>
              <Flame className="w-4 h-4 text-orange-500" />
            </button>

            <button
              onClick={() => onTriggerPreset("clear")}
              className="flex items-center justify-between bg-slate-55 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 rounded-2xl p-3.5 text-left transition cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-slate-800 block">🔄 Reset to Tranquil Baseline</span>
                <span className="text-[10px] text-slate-500 font-medium block">Clear hotspots, normal gate queue loads</span>
              </div>
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

      </div>

      {/* COLUMN 2: ACTIVE ALERTS FEED LIST */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between lg:col-span-1 text-slate-800">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4 text-blue-600" />
            </span>
            Command Center Alerts Feed
          </h3>
          <p className="text-xs text-slate-500 font-medium mb-4">
            Manage live reports. Click any alert card below to load the Gemini SOP checklists.
          </p>

          <div className="space-y-3 overflow-y-auto max-h-[450px] pr-1">
            {incidents.length > 0 ? (
              incidents.map(inc => (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  className={`border rounded-2xl p-4 text-left cursor-pointer transition ${
                    selectedIncidentId === inc.id || (incidents.length > 0 && incidents[0].id === inc.id && !selectedIncidentId)
                      ? "bg-slate-50 border-blue-500 shadow-md"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full text-white ${
                      inc.severity === "critical"
                        ? "bg-red-600 animate-pulse"
                        : inc.severity === "high"
                          ? "bg-amber-600"
                          : inc.severity === "medium"
                            ? "bg-yellow-500 text-slate-950"
                            : "bg-slate-500"
                    }`}>
                      {inc.severity} Severity
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      {inc.reportedAt}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mb-1">
                    {inc.summary}
                  </h4>
                  <div className="text-[10px] text-slate-500 font-semibold mb-2">
                    📍 {inc.location} • {inc.category}
                  </div>

                  <div className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-2 text-slate-400 font-semibold">
                    <div>Reporter: {inc.reporter}</div>
                    {inc.status === "active" ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onResolveIncident(inc.id);
                        }}
                        className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 transition"
                      >
                        <Check className="w-3 h-3" /> Resolve
                      </button>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-slate-400" /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-400 text-xs font-medium">
                No active incidents reported. Stadium secure.
              </div>
            )}
          </div>
        </div>

        {/* Live Gate Entry Managers (At the bottom of feed list) */}
        <div className="border-t border-slate-100 pt-4 mt-4">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Entrances & Wait Times
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {gates.map(gate => (
              <div key={gate.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-800 truncate">{gate.name}</span>
                  <select
                    value={gate.status}
                    onChange={(e) => onUpdateGate(gate.id, { status: e.target.value as any })}
                    className="text-[9px] bg-white border border-slate-200 text-slate-800 rounded-lg focus:outline-none p-1 font-bold shadow-sm"
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="exit-only">Exit-Only</option>
                  </select>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 font-bold">
                  <span>Wait: <strong className="text-slate-800">{gate.estimatedWaitTime}m</strong></span>
                  <span className={gate.loadFactor > 80 ? "text-red-500 font-black" : "text-emerald-600"}>
                    {gate.loadFactor}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* COLUMN 3: SELECTED INCIDENT ACTION BOARD */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl lg:col-span-1 flex flex-col justify-between shadow-sm text-slate-800">
        {activeIncident ? (
          <div>
            <div className="mb-4">
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Active SOP Card
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-2 mb-1">
                {activeIncident.summary}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Actionable SOP guidelines generated dynamically based on the report.
              </p>
            </div>

            {/* Standard Operating Procedures Steps list */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mb-4 shadow-inner">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-500" />
                Staff SOP Steps
              </h4>
              {activeIncident.sopSteps && activeIncident.sopSteps.length > 0 ? (
                <ol className="space-y-3">
                  {activeIncident.sopSteps.map((step, idx) => (
                    <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-700 font-medium">
                      <span className="text-[10px] font-bold bg-white border border-blue-200 text-blue-600 w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-slate-500 italic font-medium">
                  Run GenAI analysis to generate automatic SOP step actions.
                </p>
              )}
            </div>

            {/* Volunteer Coordination Briefing */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 mb-4 shadow-inner">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                Volunteer Field Briefing
              </h4>
              <p className="text-xs text-indigo-950 leading-relaxed italic font-semibold">
                {activeIncident.volunteerBriefing || "No automatic briefing draft compiled yet."}
              </p>
            </div>

            {/* PA Announcement Script */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 shadow-inner">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                Broadcast Announcement Script
              </h4>
              <p className="text-xs text-amber-950 leading-relaxed whitespace-pre-wrap font-bold font-mono">
                {activeIncident.paAnnouncement || "No PA announcement drafted."}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            Select an alert in the Feed column to display full Gemini SOP checklists.
          </div>
        )}

        {/* Dynamic Standing Heatmap Quick adjuster for Seating */}
        <div className="border-t border-slate-100 pt-4 mt-6">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Stand Load Factors Heatmap (Click on Map to adjust)
          </h4>
          <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-slate-500 font-bold">
            <div className="flex flex-col">
              <span>North Stand: {sectorLoads.north}%</span>
              <input 
                type="range" min="10" max="100" value={sectorLoads.north}
                onChange={(e) => onUpdateSectorLoad("north", parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
            <div className="flex flex-col">
              <span>East Stand: {sectorLoads.east}%</span>
              <input 
                type="range" min="10" max="100" value={sectorLoads.east}
                onChange={(e) => onUpdateSectorLoad("east", parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
            <div className="flex flex-col">
              <span>South Stand: {sectorLoads.south}%</span>
              <input 
                type="range" min="10" max="100" value={sectorLoads.south}
                onChange={(e) => onUpdateSectorLoad("south", parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
            <div className="flex flex-col">
              <span>West Stand: {sectorLoads.west}%</span>
              <input 
                type="range" min="10" max="100" value={sectorLoads.west}
                onChange={(e) => onUpdateSectorLoad("west", parseInt(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
