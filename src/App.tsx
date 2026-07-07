import { useState } from "react";
import { 
  Incident, Gate, VolunteerShift, LANGUAGES, 
  STADIUM_NODES, NavNode 
} from "./types";
import { ComputedRoute } from "./routeSolver";
import { StadiumMap } from "./components/StadiumMap";
import { RoleSelector } from "./components/RoleSelector";
import { FanConcierge } from "./components/FanConcierge";
import { OperationsCommand } from "./components/OperationsCommand";
import { VolunteerHub } from "./components/VolunteerHub";
import { 
  Clock, Shield, HeartHandshake, HelpCircle, 
  MapPin, Globe, Sparkles, Users, ShieldAlert, Timer, Activity
} from "lucide-react";

export default function App() {
  // Navigation Role & Global Settings
  const [currentRole, setCurrentRole] = useState<"fan" | "ops" | "volunteer">("fan");
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [currentLevel, setCurrentLevel] = useState<1 | 2>(1);

  // Wayfinding states
  const [selectedStartNodeId, setSelectedStartNodeId] = useState("gate-a");
  const [selectedEndNodeId, setSelectedEndNodeId] = useState("green-concession-1");
  const [activeRoute, setActiveRoute] = useState<ComputedRoute | null>(null);

  // 1. Initial Incidents State
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: "inc-1",
      summary: "Escalator Queue Jam Blockage",
      category: "Crowd Control",
      severity: "high",
      location: "Gate B (South Entrance)",
      reportedAt: "11:20 AM",
      status: "active",
      sopSteps: [
        "Deploy field volunteers to redirect incoming fan flows away from the jammed Escalator B base.",
        "Initiate PA announcement recommending Gate A and C for entry.",
        "Dispatch on-site mechanics to inspect escalator safety sensor trip.",
        "Contact MetLife Terminal coordinators to temporarily stagger train shuttle arrivals if platform crowding exceeds 80%."
      ],
      volunteerBriefing: "Kindly direct fans arriving from the train shuttle to walk left toward Gate A or Gate C entrances. Ensure step-free pathways remain fully clear.",
      paAnnouncement: "Attention Fans: Please use Gate A or Gate C for faster entrance entry due to escalator maintenance near Gate B.",
      reporter: "Emma Jones (Gate B Supervisor)"
    },
    {
      id: "inc-2",
      summary: "Restroom Soda Spill Slip Hazard",
      category: "Facilities",
      severity: "low",
      location: "Medical Center 104",
      reportedAt: "11:45 AM",
      status: "active",
      sopSteps: [
        "Place warning cone over the spill area in Section 104 restroom vestibule.",
        "Notify janitorial dispatch for wet-mop cleanup.",
        "Verify no slip injuries occurred during the interval."
      ],
      volunteerBriefing: "Stand near the entrance of Section 104 restroom vestibule and verbally warn passing fans of the slip hazard until janitorial staff completes cleanup.",
      paAnnouncement: "No public broadcast required for localized spill hazard.",
      reporter: "John Doe (Volunteer)"
    }
  ]);

  // 2. Initial Gates State
  const [gates, setGates] = useState<Gate[]>([
    { id: "gate-a", name: "Gate A (North West)", status: "open", loadFactor: 45, estimatedWaitTime: 4 },
    { id: "gate-b", name: "Gate B (South Rail)", status: "open", loadFactor: 92, estimatedWaitTime: 22 },
    { id: "gate-c", name: "Gate C (West Concourse)", status: "open", loadFactor: 35, estimatedWaitTime: 2 },
    { id: "gate-d", name: "Gate D (North Deck)", status: "open", loadFactor: 50, estimatedWaitTime: 6 }
  ]);

  // 3. Initial Seating Stands Load State (0-100%)
  const [sectorLoads, setSectorLoads] = useState<Record<string, number>>({
    north: 45,
    east: 65,
    south: 90,
    west: 50
  });

  // 4. Initial Volunteer Shifts State
  const [shifts, setShifts] = useState<VolunteerShift[]>([
    { id: "v-1", volunteerName: "John Doe", zone: "Gate A (Main Entrance)", role: "Greeter & Guide", status: "on-duty", nativeLanguage: "English & Spanish" },
    { id: "v-2", volunteerName: "Koji Sato", zone: "Section 130 Seating", role: "Crowd Monitor", status: "on-duty", nativeLanguage: "Japanese" },
    { id: "v-3", volunteerName: "Sofia Al-Fayed", zone: "Eco-Eats Food Court", role: "Green Ambassador", status: "resting", nativeLanguage: "Arabic & French" }
  ]);

  // Add Incident handler
  const handleAddIncident = (newIncident: Incident) => {
    setIncidents(prev => [newIncident, ...prev]);
  };

  // Resolve Incident handler
  const handleResolveIncident = (id: string) => {
    setIncidents(prev => prev.map(inc => 
      inc.id === id ? { ...inc, status: "resolved" as const } : inc
    ));
  };

  // Update Gate Status handler
  const handleUpdateGate = (gateId: string, updates: Partial<Gate>) => {
    setGates(prev => prev.map(g => 
      g.id === gateId ? { ...g, ...updates } : g
    ));
  };

  // Sector click handler to tweak capacity or show alerts
  const handleSectorClick = (sectorName: string) => {
    const id = sectorName.toLowerCase().split(" ")[0]; // north, east, south, west
    if (sectorLoads[id] !== undefined) {
      // Rotate loads for simulation fun!
      const nextLoad = sectorLoads[id] >= 90 ? 30 : sectorLoads[id] + 20;
      setSectorLoads(prev => ({ ...prev, [id]: nextLoad }));
    }
  };

  // Preset Trigger Simulator handler
  const handleTriggerPreset = (preset: "kickoff" | "exodus" | "clear") => {
    if (preset === "kickoff") {
      setSectorLoads({ north: 85, east: 90, south: 75, west: 80 });
      setGates([
        { id: "gate-a", name: "Gate A (North West)", status: "open", loadFactor: 90, estimatedWaitTime: 25 },
        { id: "gate-b", name: "Gate B (South Rail)", status: "open", loadFactor: 95, estimatedWaitTime: 32 },
        { id: "gate-c", name: "Gate C (West Concourse)", status: "open", loadFactor: 80, estimatedWaitTime: 18 },
        { id: "gate-d", name: "Gate D (North Deck)", status: "open", loadFactor: 85, estimatedWaitTime: 20 }
      ]);
    } else if (preset === "exodus") {
      setSectorLoads({ north: 40, east: 45, south: 35, west: 40 });
      setGates([
        { id: "gate-a", name: "Gate A (North West)", status: "exit-only", loadFactor: 95, estimatedWaitTime: 1 },
        { id: "gate-b", name: "Gate B (South Rail)", status: "exit-only", loadFactor: 99, estimatedWaitTime: 1 },
        { id: "gate-c", name: "Gate C (West Concourse)", status: "exit-only", loadFactor: 90, estimatedWaitTime: 1 },
        { id: "gate-d", name: "Gate D (North Deck)", status: "exit-only", loadFactor: 92, estimatedWaitTime: 1 }
      ]);
    } else {
      setSectorLoads({ north: 45, east: 65, south: 35, west: 55 });
      setGates([
        { id: "gate-a", name: "Gate A (North West)", status: "open", loadFactor: 45, estimatedWaitTime: 4 },
        { id: "gate-b", name: "Gate B (South Rail)", status: "open", loadFactor: 52, estimatedWaitTime: 6 },
        { id: "gate-c", name: "Gate C (West Concourse)", status: "open", loadFactor: 35, estimatedWaitTime: 2 },
        { id: "gate-d", name: "Gate D (North Deck)", status: "open", loadFactor: 50, estimatedWaitTime: 6 }
      ]);
    }
  };

  const handleUpdateShiftStatus = (id: string, status: VolunteerShift["status"]) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  // Node Click Wayfinding Bridge
  const handleSelectNodeFromMap = (nodeId: string) => {
    // If start is empty, fill start. If start is filled, fill end.
    if (!selectedStartNodeId || (selectedStartNodeId && selectedEndNodeId)) {
      setSelectedStartNodeId(nodeId);
      setSelectedEndNodeId("");
    } else {
      setSelectedEndNodeId(nodeId);
    }
  };

  const averageWait = Math.round(gates.reduce((acc, g) => acc + g.estimatedWaitTime, 0) / gates.length);
  const activeAlertsCount = incidents.filter(i => i.status === "active").length;
  const peakSectorLoad = Math.max(...Object.values(sectorLoads).map(val => Number(val) || 0));
  const activeStaffCount = shifts.filter(s => s.status === "on-duty").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* GLOBAL BRANDING HEADER */}
      <header className="bg-white/90 border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md px-4 sm:px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center shrink-0 shadow-md">
              <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center text-[9px] text-white font-black">FWC</div>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-none tracking-tight flex items-center gap-2 font-display">
                FIFA 2026 STADIUM <span className="text-blue-600">HUB</span>
                <span className="text-[10px] bg-blue-50 text-blue-600 font-mono font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                  GenAI: ACTIVE
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-semibold tracking-tight mt-1">
                METLIFE STADIUM • FIFA WORLD CUP 2026™
              </p>
            </div>
          </div>

          {/* Real-time Match Center Indicator */}
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="text-xs font-mono">
              <div className="text-slate-800 font-bold text-[11px] tracking-wide">METLIFE STADIUM • GROUP STAGE</div>
              <div className="text-slate-500 text-[10px]">USA vs ENGLAND • KICKOFF IN 2H 45M</div>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
            <Globe className="w-4 h-4 text-slate-400 ml-1.5" />
            <select
              value={currentLanguage}
              onChange={(e) => setCurrentLanguage(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-700 font-bold focus:outline-none focus:ring-0 pr-6"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        
        {/* Role Portal Select Switcher */}
        <RoleSelector 
          currentRole={currentRole} 
          onChangeRole={(role) => setCurrentRole(role)} 
        />

        {/* BENTO STATS STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition duration-300 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
              <Timer className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Average Wait</span>
              <span className="text-lg font-display font-black text-slate-800 tracking-tight block">{averageWait} mins</span>
              <span className="text-[10px] font-mono font-bold text-slate-400 block">Live gates queue</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition duration-300 flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-500 rounded-2xl shrink-0">
              <ShieldAlert className={`w-5 h-5 text-red-600 ${activeAlertsCount > 0 ? "animate-pulse" : ""}`} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Active Alerts</span>
              <span className="text-lg font-display font-black text-slate-800 tracking-tight block">{activeAlertsCount} Reports</span>
              <span className="text-[10px] font-mono font-bold text-red-500 block">SOP Dispatch Ready</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition duration-300 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Peak Sector Load</span>
              <span className="text-lg font-display font-black text-slate-800 tracking-tight block">{peakSectorLoad}% Capacity</span>
              <span className="text-[10px] font-mono font-bold text-emerald-600 block">South Grandstands</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md transition duration-300 flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Volunteers Active</span>
              <span className="text-lg font-display font-black text-slate-800 tracking-tight block">{activeStaffCount} On-Duty</span>
              <span className="text-[10px] font-mono font-bold text-slate-400 block">Field Translators</span>
            </div>
          </div>

        </div>

        {/* DOUBLE COLUMN LAYOUT: Interactive map on left, role portal on right */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Map Section (Spans 5 of 12 columns on desktop) */}
          <div className="xl:col-span-5 flex flex-col gap-4">
            <StadiumMap
              currentLevel={currentLevel}
              setCurrentLevel={setCurrentLevel}
              selectedStartNodeId={selectedStartNodeId}
              selectedEndNodeId={selectedEndNodeId}
              onSelectNode={handleSelectNodeFromMap}
              activePathPoints={activeRoute ? activeRoute.points : null}
              gateLoads={sectorLoads}
              activeIncidents={incidents.filter(i => i.status === "active")}
              role={currentRole}
              onSectorClick={handleSectorClick}
            />

            {/* Quick Wayfinding tip */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-start gap-2.5 text-[11px] text-slate-500">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">Pro Tip:</strong> Click any pin or stand sector on the live map vector directly to load locations or simulate crowd densities.
              </div>
            </div>
          </div>

          {/* Active Portal Workflow (Spans 7 of 12 columns on desktop) */}
          <div className="xl:col-span-7">
            {currentRole === "fan" && (
              <FanConcierge
                selectedStartNodeId={selectedStartNodeId}
                selectedEndNodeId={selectedEndNodeId}
                onSelectNode={(nodeId) => {
                  if (!selectedStartNodeId || (selectedStartNodeId && selectedEndNodeId)) {
                    setSelectedStartNodeId(nodeId);
                    setSelectedEndNodeId("");
                  } else {
                    setSelectedEndNodeId(nodeId);
                  }
                }}
                activeRoute={activeRoute}
                onSetRoute={setActiveRoute}
                currentLanguage={currentLanguage}
              />
            )}

            {currentRole === "ops" && (
              <OperationsCommand
                incidents={incidents}
                onAddIncident={handleAddIncident}
                onResolveIncident={handleResolveIncident}
                gates={gates}
                onUpdateGate={handleUpdateGate}
                sectorLoads={sectorLoads}
                onUpdateSectorLoad={(sectorId, load) => {
                  setSectorLoads(prev => ({ ...prev, [sectorId]: load }));
                }}
                onTriggerPreset={handleTriggerPreset}
              />
            )}

            {currentRole === "volunteer" && (
              <VolunteerHub
                shifts={shifts}
                onUpdateShiftStatus={handleUpdateShiftStatus}
                currentLanguage={currentLanguage}
              />
            )}
          </div>

        </div>

      </main>

      {/* ACCREDITATION FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 mt-12 text-center text-xs text-slate-500 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-medium text-slate-500">
            FIFA World Cup 2026 Stadium Hub • Built with React & Express • Verified for Challenge 4 (Prompt Wars)
          </p>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              All Systems Operational
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
