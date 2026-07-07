import React from "react";
import { User, ShieldAlert, Users } from "lucide-react";

interface RoleSelectorProps {
  currentRole: "fan" | "ops" | "volunteer";
  onChangeRole: (role: "fan" | "ops" | "volunteer") => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ currentRole, onChangeRole }) => {
  const roles = [
    {
      id: "fan" as const,
      title: "Fan & Visitor Experience",
      description: "Smart wayfinding, multilingual AI assistant, and eco rewards.",
      badge: "LIVE PORTAL",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: User,
      color: "border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-emerald-100",
      iconColor: "bg-emerald-100 text-emerald-700"
    },
    {
      id: "ops" as const,
      title: "Operations & Command Center",
      description: "AI dispatcher, standard operating procedures, and crowd heatmaps.",
      badge: "STADIUM COMMAND",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      icon: ShieldAlert,
      color: "border-blue-600 bg-blue-50/70 text-blue-950 shadow-blue-100",
      iconColor: "bg-blue-100 text-blue-700"
    },
    {
      id: "volunteer" as const,
      title: "Volunteer & Field Coordinator",
      description: "Shift assignments, native incident tools, and translation guides.",
      badge: "STAFF HUB",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      icon: Users,
      color: "border-indigo-500 bg-indigo-50/70 text-indigo-950 shadow-indigo-100",
      iconColor: "bg-indigo-100 text-indigo-700"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {roles.map(role => {
        const Icon = role.icon;
        const isActive = currentRole === role.id;

        return (
          <button
            key={role.id}
            onClick={() => onChangeRole(role.id)}
            className={`relative flex flex-col items-start p-5 rounded-3xl border text-left transition-all duration-300 cursor-pointer ${
              isActive 
                ? `${role.color} border-2 scale-[1.01] shadow-lg` 
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
            }`}
          >
            {/* Role Header Badge */}
            <span className={`absolute top-4 right-4 text-[9px] font-mono border font-bold px-2.5 py-0.5 rounded-full ${role.badgeColor}`}>
              {role.badge}
            </span>

            {/* Icon Wrapper */}
            <div className={`p-3 rounded-xl mb-4 ${isActive ? role.iconColor : "bg-slate-100 text-slate-400"}`}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Text details */}
            <h3 className={`text-sm font-bold mb-1 ${isActive ? "text-slate-900" : "text-slate-800"}`}>
              {role.title}
            </h3>
            <p className={`text-xs leading-relaxed ${isActive ? "text-slate-700 font-medium" : "text-slate-500"}`}>
              {role.description}
            </p>
          </button>
        );
      })}
    </div>
  );
};
