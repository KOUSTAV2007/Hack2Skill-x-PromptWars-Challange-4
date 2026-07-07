import React, { useState, useEffect } from "react";
import { STADIUM_NODES, NavNode, ECO_ITEMS, EcoItem } from "../types";
import { computeStadiumRoute, ComputedRoute } from "../routeSolver";
import { 
  Compass, MapPin, Sparkles, Send, Leaf, HelpCircle, 
  Trash2, Globe, Award, Loader2, CheckCircle, ArrowRight, Accessibility
} from "lucide-react";

interface FanConciergeProps {
  selectedStartNodeId: string;
  selectedEndNodeId: string;
  onSelectNode: (nodeId: string) => void;
  activeRoute: ComputedRoute | null;
  onSetRoute: (route: ComputedRoute | null) => void;
  currentLanguage: string;
}

export const FanConcierge: React.FC<FanConciergeProps> = ({
  selectedStartNodeId,
  selectedEndNodeId,
  onSelectNode,
  activeRoute,
  onSetRoute,
  currentLanguage
}) => {
  // AI Concierge State
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Sustainability State
  const [selectedEcoItemId, setSelectedEcoItemId] = useState(ECO_ITEMS[0].id);
  const [customEcoItemName, setCustomEcoItemName] = useState("");
  const [ecoResult, setEcoResult] = useState<{
    bin: "recycle" | "compost" | "landfill";
    explanation: string;
    co2Saved: number;
    points: number;
    badge?: string;
  } | null>(null);
  const [isEcoLoading, setIsEcoLoading] = useState(false);

  // User persistent score (saved in state/localStorage)
  const [ecoPoints, setEcoPoints] = useState<number>(() => {
    return parseInt(localStorage.getItem("eco_points") || "0", 10);
  });
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem("eco_badges") || '["Stadium Pioneer"]');
  });

  // Calculate route whenever start or end node changes
  useEffect(() => {
    if (selectedStartNodeId && selectedEndNodeId) {
      if (selectedStartNodeId === selectedEndNodeId) {
        onSetRoute(null);
      } else {
        const computed = computeStadiumRoute(selectedStartNodeId, selectedEndNodeId);
        onSetRoute(computed);
      }
    } else {
      onSetRoute(null);
    }
  }, [selectedStartNodeId, selectedEndNodeId, onSetRoute]);

  // Persist Eco Rewards
  useEffect(() => {
    localStorage.setItem("eco_points", ecoPoints.toString());
    localStorage.setItem("eco_badges", JSON.stringify(unlockedBadges));
  }, [ecoPoints, unlockedBadges]);

  // Handle AI Concierge call
  const handleAskConcierge = async (customQ?: string) => {
    const query = customQ || question;
    if (!query.trim()) return;

    setIsAiLoading(true);
    setAiAnswer(null);

    const startNode = STADIUM_NODES.find(n => n.id === selectedStartNodeId);
    const fanLocation = startNode ? startNode.name : "Unspecified sector";

    try {
      const response = await fetch("/api/guide/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          language: currentLanguage,
          fanLocation
        })
      });

      const data = await response.json();
      if (data.answer) {
        setAiAnswer(data.answer);
      } else {
        setAiAnswer("Sorry, I could not process your request. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setAiAnswer("Network error. Make sure your server is running.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Handle Eco sorting call
  const handleClassifyEco = async () => {
    let itemToClassify = "";
    if (customEcoItemName.trim()) {
      itemToClassify = customEcoItemName.trim();
    } else {
      const predefined = ECO_ITEMS.find(e => e.id === selectedEcoItemId);
      itemToClassify = predefined ? predefined.name : "recyclable cup";
    }

    setIsEcoLoading(true);
    setEcoResult(null);

    try {
      const response = await fetch("/api/eco/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName: itemToClassify })
      });

      const data = await response.json();
      if (data && data.bin) {
        setEcoResult(data);

        // Update score & badges
        setEcoPoints(prev => prev + data.points);
        if (data.badge && !unlockedBadges.includes(data.badge)) {
          setUnlockedBadges(prev => [...prev, data.badge]);
        }
        
        // Reset custom input
        setCustomEcoItemName("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEcoLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setQuestion(q);
    handleAskConcierge(q);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT COLUMN: WAYFINDING & AI CONCIERGE */}
      <div className="flex flex-col gap-6">
        
        {/* Section 1: Wayfinding Core */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <h3 className="text-xs font-bold text-slate-550 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Compass className="w-4 h-4" />
            </span>
            Stadium Route Wayfinding
          </h3>
          <p className="text-xs text-slate-700 font-semibold mb-4">
            Select a start and destination pin on the live map or use the dropdowns below to draw your walking path.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="start-point-select" className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Start Point
              </label>
              <select
                id="start-point-select"
                value={selectedStartNodeId}
                onChange={(e) => onSelectNode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-offset-1"
              >
                <option value="">-- Click on Map or Choose --</option>
                {STADIUM_NODES.map(node => (
                  <option key={node.id} value={node.id}>
                    {node.name} (L{node.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="destination-select" className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Destination
              </label>
              <select
                id="destination-select"
                value={selectedEndNodeId}
                onChange={(e) => {
                  const node = STADIUM_NODES.find(n => n.id === e.target.value);
                  if (node) {
                    onSelectNode(node.id);
                  }
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-offset-1"
              >
                <option value="">-- Click on Map or Choose --</option>
                {STADIUM_NODES.map(node => (
                  <option key={node.id} value={node.id}>
                    {node.name} (L{node.level})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Route Summary Results */}
          {activeRoute ? (
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 transition-all">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                    Calculated Path
                  </span>
                  {activeRoute.isAccessible && (
                    <span className="text-[10px] bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-full border border-sky-200 flex items-center gap-1 font-bold">
                      <Accessibility className="w-3 h-3" /> Step-Free
                    </span>
                  )}
                </div>
                <div className="text-right text-xs text-slate-500 font-semibold">
                  <span className="font-black text-slate-800 text-sm">{activeRoute.distanceMeters}m</span> (~
                  <span className="font-black text-slate-800 text-sm">
                    {Math.ceil(activeRoute.estimatedTimeSeconds / 60)} min
                  </span> walk)
                </div>
              </div>

              {/* Step By Step Directions */}
              <h4 className="text-[10px] font-bold text-slate-650 uppercase tracking-wider mb-2">
                Turn-by-Turn Navigation
              </h4>
              <ul className="space-y-2">
                {activeRoute.steps.map((step, idx) => (
                  <li key={idx} className="flex gap-2 items-start text-xs text-slate-700 font-medium">
                    <span className="text-blue-500 font-black mt-0.5">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center p-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
              <MapPin className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">
                Select both a Start and Destination node on the map to show navigation routing.
              </p>
            </div>
          )}
        </div>

        {/* Section 2: AI Multilingual Guide (Concierge) */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl flex-1 flex flex-col">
          <h3 className="text-xs font-bold text-slate-650 uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            AI Multilingual Concierge
          </h3>
          <p className="text-xs text-slate-700 font-semibold mb-4">
            Our World Cup concierge answers transit, seating, safety, and stadium service questions in your language.
          </p>

          {/* Quick Questions Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleQuickQuestion("Where is the nearest wheelchair accessible elevator?")}
              className="text-[10px] bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
            >
              ♿ Accessibility?
            </button>
            <button
              onClick={() => handleQuickQuestion("How do I catch the World Cup Rail train back to the city?")}
              className="text-[10px] bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
            >
              🚆 Transit options?
            </button>
            <button
              onClick={() => handleQuickQuestion("Is there a quiet or sensory room in the stadium?")}
              className="text-[10px] bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl px-2.5 py-1.5 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
            >
              🤫 Quiet Room?
            </button>
          </div>

          {/* Question Text Box */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              aria-label="Ask AI Multilingual Concierge Question"
              placeholder="Ask anything (e.g., 'Do green food concession stands take cash?')"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskConcierge()}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 placeholder-slate-400"
            />
            <button
              onClick={() => handleAskConcierge()}
              disabled={isAiLoading || !question.trim()}
              aria-label="Submit Question"
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 text-white rounded-xl p-3 px-4 transition flex items-center justify-center cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {isAiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Response Display Box */}
          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-4 overflow-y-auto max-h-[250px] text-xs leading-relaxed text-slate-700 font-semibold shadow-inner">
            {isAiLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="font-mono text-[10px] tracking-wider uppercase animate-pulse">
                  Gemini API is drafting guide...
                </span>
              </div>
            ) : aiAnswer ? (
              <div className="space-y-2 whitespace-pre-wrap">
                <div className="flex items-start gap-1.5 text-[11px] font-bold text-blue-600 uppercase tracking-wide mb-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> FIFA Assist Answer:
                </div>
                {aiAnswer}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-10">
                <HelpCircle className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                Type your question or click a prompt above to generate detailed AI stadium responses.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: ECO-REWARDS SORTING HUB */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col justify-between shadow-sm text-slate-800">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xs font-bold text-slate-650 uppercase tracking-widest flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <Leaf className="w-4 h-4" />
              </span>
              Eco-Fan Green Pass & Rewards
            </h3>

            {/* Total score panel */}
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider">
                Green Pass Points
              </span>
              <span className="text-xl font-black text-emerald-600 tracking-tight">
                {ecoPoints} XP
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-700 font-semibold mb-5">
            Participate in the FIFA 2026 Sustainability Initiative. Scan or enter any food cup, program guide, or can to classify it correctly and earn reward perks.
          </p>

          {/* Quick Select Predefined Item */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-5 shadow-inner">
            <label htmlFor="custom-eco-input" className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Trash Item to Sort
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {ECO_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedEcoItemId(item.id);
                    setCustomEcoItemName("");
                  }}
                  aria-label={`Select item ${item.displayName}`}
                  className={`text-[10px] border p-2.5 rounded-xl text-left transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    selectedEcoItemId === item.id && !customEcoItemName
                      ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <div className="font-bold truncate">{item.displayName}</div>
                  <div className="text-[8px] text-emerald-600 font-black">+{Math.round(item.estimatedCO2 * 100)}g CO2</div>
                </button>
              ))}
            </div>

            <div className="text-center text-xs text-slate-500 my-2 font-bold uppercase tracking-wider">-- OR Type Custom Item --</div>

            {/* Custom trash item input */}
            <input
              id="custom-eco-input"
              type="text"
              aria-label="Or enter custom trash item name"
              placeholder="e.g. Cardboard pizza box, Leftover hot dog bun..."
              value={customEcoItemName}
              onChange={(e) => setCustomEcoItemName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600 placeholder-slate-400"
            />
          </div>

          {/* Classify Action button */}
          <button
            onClick={handleClassifyEco}
            disabled={isEcoLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-100 text-white font-bold rounded-xl py-3.5 px-4 transition flex items-center justify-center gap-2 mb-5 shadow-md shadow-emerald-100 cursor-pointer"
          >
            {isEcoLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sorting item with GenAI analysis...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Scan & Record Sorting
              </>
            )}
          </button>

          {/* Sorting Results Display */}
          {ecoResult ? (
            <div className={`border rounded-2xl p-4 transition-all duration-300 ${
              ecoResult.bin === "compost" 
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-950 font-medium" 
                : ecoResult.bin === "recycle"
                  ? "bg-blue-50/80 border-blue-200 text-blue-950 font-medium"
                  : "bg-slate-50 border-slate-200 text-slate-800 font-medium"
            }`}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    ecoResult.bin === "compost" 
                      ? "bg-emerald-600 text-white" 
                      : ecoResult.bin === "recycle"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-500 text-white"
                  }`}>
                    {ecoResult.bin} Bin
                  </span>
                  <span className="text-xs font-bold text-slate-800">Disposal Route</span>
                </div>
                <div className="text-xs font-black text-emerald-600">
                  +{ecoResult.points} Green Points
                </div>
              </div>

              <p className="text-xs leading-relaxed mb-3">
                {ecoResult.explanation}
              </p>

              <div className="flex items-center justify-between text-[11px] font-mono border-t border-slate-200/60 pt-3 text-slate-500">
                <div>
                  CO₂ OFFSET PREVENTED: <span className="font-bold text-slate-800">{ecoResult.co2Saved} kg</span>
                </div>
                {ecoResult.badge && (
                  <div className="flex items-center gap-1 text-yellow-600 text-xs font-bold">
                    <Award className="w-3.5 h-3.5" />
                    <span>Badge: {ecoResult.badge}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center p-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
              <CheckCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">
                Sorted results, CO2 offsetting numbers, and reward point notifications will render here.
              </p>
            </div>
          )}
        </div>

        {/* Unlocked Eco-Badges Display */}
        <div className="border-t border-slate-200/60 pt-4 mt-6">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Your Digital Achievement Badges
          </h4>
          <div className="flex flex-wrap gap-2">
            {unlockedBadges.map((badge, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-slate-50 border border-slate-200 text-yellow-600 font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-sm"
              >
                <Award className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                {badge}
              </span>
            ))}
            <span className="text-[10px] border border-dashed border-slate-200 text-slate-400 px-2.5 py-1 rounded-xl font-semibold">
              + More Lockable
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
