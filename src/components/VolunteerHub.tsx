import React, { useState } from "react";
import { VolunteerShift } from "../types";
import { 
  Users, Sparkles, MessageSquare, Send, Loader2, HelpCircle, 
  Clock, ShieldAlert, Award, Globe, HeartHandshake, CheckCircle 
} from "lucide-react";

interface VolunteerHubProps {
  shifts: VolunteerShift[];
  onUpdateShiftStatus: (id: string, status: VolunteerShift["status"]) => void;
  currentLanguage: string;
}

export const VolunteerHub: React.FC<VolunteerHubProps> = ({
  shifts,
  onUpdateShiftStatus,
  currentLanguage
}) => {
  // AI Volunteer Assistant State
  const [scenarioQuery, setScenarioQuery] = useState("");
  const [aiProtocol, setAiProtocol] = useState<string | null>(null);
  const [isLoadingProtocol, setIsLoadingProtocol] = useState(false);

  // Call Gemini API to get de-escalation script or guidance
  const handleGetGuidance = async (presetQ?: string) => {
    const query = presetQ || scenarioQuery;
    if (!query.trim()) return;

    setIsLoadingProtocol(true);
    setAiProtocol(null);

    try {
      const response = await fetch("/api/guide/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `You are the FIFA World Cup Volunteer Support Coordinator. Give immediate step-by-step guidance, de-escalation phrasing, or translation sentences to a stadium volunteer dealing with this field situation: "${query}". Respond concisely (maximum 150 words) with clear bullet points. Language: ${currentLanguage}.`,
          language: currentLanguage
        })
      });

      const data = await response.json();
      if (data.answer) {
        setAiProtocol(data.answer);
      } else {
        setAiProtocol("Could not fetch coordination guidance. Please check server.");
      }
    } catch (err) {
      console.error(err);
      setAiProtocol("Network error. Please try again.");
    } finally {
      setIsLoadingProtocol(false);
    }
  };

  const handleQuickPreset = (situation: string) => {
    setScenarioQuery(situation);
    handleGetGuidance(situation);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* COLUMN 1 & 2: VOLUNTEER AI CRISIS GUIDE ASSISTANT */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        <div className="bg-white border border-slate-200 p-6 rounded-3xl flex-1 flex flex-col justify-between shadow-sm text-slate-800">
          <div>
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </span>
              Volunteer AI De-escalation & Translation Guide
            </h3>
            <p className="text-xs text-slate-700 font-semibold mb-4">
              Access real-time guidance on lost companions, seat conflicts, or custom translator phrases supported by Gemini.
            </p>

            {/* Quick Presets situations */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <button
                onClick={() => handleQuickPreset("A Japanese-speaking fan lost their 8-year-old child near Gate A. I need to translate reassurance and alert security.")}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl p-3.5 text-left transition text-[10px] cursor-pointer shadow-sm"
              >
                <Globe className="w-4 h-4 text-sky-600 mb-1" />
                <span className="font-bold text-slate-800 block mb-0.5">Lost Child (Japanese)</span>
                Instant translations & alerts
              </button>

              <button
                onClick={() => handleQuickPreset("Two fans are arguing loudly over seat double-booking in Section 115. Rival teams are involved.")}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl p-3.5 text-left transition text-[10px] cursor-pointer shadow-sm"
              >
                <ShieldAlert className="w-4 h-4 text-red-500 mb-1" />
                <span className="font-bold text-slate-800 block mb-0.5">Seat Conflict Dispute</span>
                De-escalation protocols
              </button>

              <button
                onClick={() => handleQuickPreset("A fan is collapsed near Concession 2 complaining of heat stroke. I have called first aid.")}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl p-3.5 text-left transition text-[10px] cursor-pointer shadow-sm"
              >
                <HeartHandshake className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="font-bold text-slate-800 block mb-0.5">Medical Heat Stroke</span>
                Immediate support steps
              </button>
            </div>

            {/* Text input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                aria-label="Type dynamic field issue for volunteer guidance"
                placeholder="Type dynamic field issue (e.g., 'Angry fan is demanding refunds because gate was closed early')"
                value={scenarioQuery}
                onChange={(e) => setScenarioQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGetGuidance()}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 placeholder-slate-400"
              />
              <button
                onClick={() => handleGetGuidance()}
                disabled={isLoadingProtocol || !scenarioQuery.trim()}
                aria-label="Submit scenario to AI Guide"
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 text-white rounded-xl p-3 px-4 transition flex items-center justify-center cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {isLoadingProtocol ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* AI Guidance output box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[180px] text-xs leading-relaxed text-slate-700 font-semibold shadow-inner">
            {isLoadingProtocol ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="font-mono text-[10px] uppercase tracking-wider animate-pulse">
                  Fulfilling shift guidance query...
                </span>
              </div>
            ) : aiProtocol ? (
              <div className="space-y-2 whitespace-pre-wrap">
                <div className="flex items-start gap-1.5 text-[11px] font-bold text-blue-600 uppercase tracking-wide mb-1.5">
                  <HeartHandshake className="w-4 h-4" /> Recommended Field Action Checklist:
                </div>
                {aiProtocol}
              </div>
            ) : (
              <div className="text-center text-slate-600 py-16">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                Input dynamic situations or click quick guidelines above for direct de-escalation scripts.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* COLUMN 3: VOLUNTEER SHIFTS BOARD */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col justify-between lg:col-span-1 shadow-sm text-slate-800">
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Clock className="w-4 h-4 text-indigo-600" />
            </span>
            Active Field Shifts
          </h3>
          <p className="text-xs text-slate-700 font-semibold mb-4">
            Track volunteer assignments, native languages, and real-time statuses across the stadium sectors.
          </p>

          <div className="space-y-3">
            {shifts.map(shift => (
              <div 
                key={shift.id}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5"
              >
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {shift.volunteerName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block">
                      📍 {shift.zone} • {shift.role}
                    </span>
                  </div>

                  {/* Shift Status switcher dropdown */}
                  <select
                    value={shift.status}
                    onChange={(e) => onUpdateShiftStatus(shift.id, e.target.value as any)}
                    aria-label={`Update shift status for ${shift.volunteerName}`}
                    className={`text-[9px] font-bold uppercase tracking-wide p-1 rounded-lg border focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer ${
                      shift.status === "on-duty"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold"
                        : shift.status === "resting"
                          ? "bg-amber-50 border-amber-200 text-amber-700 font-bold"
                          : "bg-white border-slate-200 text-slate-500"
                    }`}
                  >
                    <option value="on-duty">On Duty</option>
                    <option value="resting">Resting</option>
                    <option value="completed">Done</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 font-bold border-t border-slate-200/60 pt-2 mt-2">
                  <span>Language: {shift.nativeLanguage}</span>
                  <span className="text-yellow-600 flex items-center gap-0.5">
                    <Award className="w-3 h-3" /> Gold Volunteer
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Support Call-to-action */}
        <div className="border-t border-slate-200/60 pt-4 mt-6">
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 p-3.5 rounded-2xl text-xs text-slate-700 font-semibold">
            <CheckCircle className="w-4 h-4 text-red-500 shrink-0 animate-pulse" />
            <div>
              <strong className="text-red-700 block font-bold">Emergency line: Dial 911-FIFA</strong>
              <p className="text-[10px] text-slate-500 font-medium">For security emergencies, dispatch first aid instantly.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
