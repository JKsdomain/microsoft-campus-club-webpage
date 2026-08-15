"use client";

import React from "react";
import { Shield, UserCheck, Layers, Cpu, Server, Network } from "lucide-react";

interface LoginImagePanelProps {
  role: "admin" | "office-bearer";
}

export const LoginImagePanel: React.FC<LoginImagePanelProps> = ({ role }) => {
  const isAdmin = role === "admin";

  return (
    <div className="relative w-full h-48 sm:h-64 lg:h-full min-h-[220px] lg:min-h-[600px] bg-[#07111F] border-b lg:border-b-0 lg:border-r border-white/10 overflow-hidden flex flex-col justify-between p-6 sm:p-10">
      {/* Background Ambient Glow */}
      <div
        className={`absolute inset-0 bg-radial ${
          isAdmin
            ? "from-purple-900/20 via-[#0078D4]/10 to-transparent"
            : "from-[#0078D4]/20 via-[#22D3EE]/10 to-transparent"
        } blur-3xl opacity-70`}
      />

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Top Bar / Status */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="grid grid-cols-2 gap-0.5 w-5 h-5 p-0.5 rounded bg-white/10 border border-white/10">
            <span className="bg-[#F25022] rounded-[1px]" />
            <span className="bg-[#7FBA00] rounded-[1px]" />
            <span className="bg-[#00A4EF] rounded-[1px]" />
            <span className="bg-[#FFB900] rounded-[1px]" />
          </div>
          <span className="text-xs font-bold tracking-wider text-white">MCC</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${isAdmin ? "bg-purple-400" : "bg-[#22D3EE]"} animate-pulse`} />
          <span className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-widest">
            {isAdmin ? "ADMIN_PORTAL" : "OB_PORTAL"}
          </span>
        </div>
      </div>

      {/* Center Hero Geometric Graphic Composition */}
      <div className="relative z-10 my-auto py-4 flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          {/* Outer Ring */}
          <div
            className={`w-24 h-24 sm:w-32 sm:h-32 rounded-3xl ${
              isAdmin
                ? "bg-purple-950/40 border-purple-500/30"
                : "bg-[#0D1B2A]/80 border-[#0078D4]/40"
            } border flex items-center justify-center shadow-2xl backdrop-blur-md relative`}
          >
            {/* Center Icon */}
            {isAdmin ? (
              <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-purple-300 stroke-[1.5]" />
            ) : (
              <UserCheck className="w-12 h-12 sm:w-16 sm:h-16 text-[#22D3EE] stroke-[1.5]" />
            )}

            {/* Orbiting Tech Nodes */}
            <div className="absolute -top-2 -right-2 p-2 rounded-xl bg-[#122438] border border-white/10 text-white">
              {isAdmin ? <Server className="w-4 h-4 text-purple-400" /> : <Network className="w-4 h-4 text-[#22D3EE]" />}
            </div>
            <div className="absolute -bottom-2 -left-2 p-2 rounded-xl bg-[#122438] border border-white/10 text-white">
              {isAdmin ? <Cpu className="w-4 h-4 text-[#0078D4]" /> : <Layers className="w-4 h-4 text-[#0078D4]" />}
            </div>
          </div>
        </div>

        {/* Caption Label */}
        <h3 className="text-lg sm:text-xl font-bold text-[#F8FAFC] tracking-tight">
          {isAdmin ? "Platform Controls & Governance" : "Club Operations & Leadership"}
        </h3>
        <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 max-w-xs leading-relaxed">
          {isAdmin
            ? "Centralized administrative infrastructure for Microsoft Campus Club."
            : "Operational portal for active MCC Office Bearers and leads."}
        </p>
      </div>

      {/* Bottom Footer Metadata */}
      <div className="relative z-10 hidden sm:flex items-center justify-between pt-4 border-t border-white/10 text-[11px] font-mono text-[#94A3B8]">
        <span>SYS_SEC // AUTH_ENFORCED</span>
        <span>AUTH_V2.0</span>
      </div>
    </div>
  );
};
