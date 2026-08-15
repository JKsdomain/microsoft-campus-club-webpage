"use client";

import React from "react";

export const HeroVisual: React.FC = () => {
  return (
    <div className="relative w-full aspect-[4/3] max-w-lg lg:max-w-none mx-auto flex items-center justify-center p-4">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-radial from-[#0078D4]/20 via-[#22D3EE]/5 to-transparent blur-3xl opacity-60 rounded-full" />

      {/* Outer Tech Border Box */}
      <div className="relative w-full h-full rounded-2xl border border-white/10 bg-[#0D1B2A]/70 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-2xl shadow-black/50">
        
        {/* Top Visual Bar / Status Indicators */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 z-10">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#0078D4] animate-pulse" />
            <span className="text-xs font-mono text-[#CBD5E1] tracking-wider uppercase">
              MCC DIGITAL PLATFORM :: ONLINE
            </span>
          </div>
          <div className="flex space-x-1.5">
            <div className="w-2 h-2 rounded-full bg-[#F25022]" />
            <div className="w-2 h-2 rounded-full bg-[#7FBA00]" />
            <div className="w-2 h-2 rounded-full bg-[#00A4EF]" />
            <div className="w-2 h-2 rounded-full bg-[#FFB900]" />
          </div>
        </div>

        {/* Central Geometric Tech Architecture & Network Grid */}
        <div className="relative my-auto py-6 flex items-center justify-center">
          <svg
            className="w-full h-56 sm:h-64 text-[#0078D4]"
            viewBox="0 0 400 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Grid Pattern Lines */}
            <g opacity="0.15" stroke="currentColor" strokeWidth="1">
              <path d="M0 40H400M0 80H400M0 120H400M0 160H400M0 200H400" />
              <path d="M40 0V240M80 0V240M120 0V240M160 0V240M200 0V240M240 0V240M280 0V240M320 0V240M360 0V240" />
            </g>

            {/* Connecting Network Paths */}
            <path
              d="M60 180 L140 120 L200 160 L280 80 L340 120"
              stroke="#0078D4"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.8"
            />
            <path
              d="M60 80 L120 160 L220 80 L300 160 L340 60"
              stroke="#22D3EE"
              strokeWidth="1.5"
              opacity="0.6"
            />
            <path
              d="M140 120 L220 80 M200 160 L280 80"
              stroke="white"
              strokeWidth="1"
              opacity="0.3"
            />

            {/* Central Node Structure */}
            <circle cx="200" cy="120" r="36" fill="#07111F" stroke="#0078D4" strokeWidth="2" />
            <circle cx="200" cy="120" r="28" fill="#0D1B2A" stroke="#22D3EE" strokeWidth="1" opacity="0.8" />
            
            {/* Central MCC Emblem */}
            <rect x="190" y="110" width="8" height="8" fill="#F25022" rx="1" />
            <rect x="202" y="110" width="8" height="8" fill="#7FBA00" rx="1" />
            <rect x="190" y="122" width="8" height="8" fill="#00A4EF" rx="1" />
            <rect x="202" y="122" width="8" height="8" fill="#FFB900" rx="1" />

            {/* Network Nodes */}
            <g className="animate-pulse">
              <circle cx="60" cy="180" r="6" fill="#0078D4" />
              <circle cx="140" cy="120" r="7" fill="#22D3EE" />
              <circle cx="200" cy="160" r="5" fill="#0078D4" />
              <circle cx="280" cy="80" r="8" fill="#0078D4" />
              <circle cx="340" cy="120" r="6" fill="#22D3EE" />
              <circle cx="120" cy="160" r="5" fill="white" />
              <circle cx="300" cy="160" r="6" fill="#0078D4" />
            </g>

            {/* Node Glowing Rings */}
            <circle cx="280" cy="80" r="14" stroke="#0078D4" strokeWidth="1" opacity="0.4" />
            <circle cx="140" cy="120" r="12" stroke="#22D3EE" strokeWidth="1" opacity="0.4" />
          </svg>
        </div>

        {/* Bottom Platform Modules Tag Bar */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10 z-10">
          <div className="bg-[#122438] p-2.5 rounded-lg border border-white/5 flex flex-col items-center text-center">
            <span className="text-[10px] text-[#94A3B8] font-mono uppercase">CONNECT</span>
            <span className="text-xs font-semibold text-[#F8FAFC]">Community</span>
          </div>
          <div className="bg-[#122438] p-2.5 rounded-lg border border-white/5 flex flex-col items-center text-center">
            <span className="text-[10px] text-[#94A3B8] font-mono uppercase">COLLABORATE</span>
            <span className="text-xs font-semibold text-[#22D3EE]">Projects</span>
          </div>
          <div className="bg-[#122438] p-2.5 rounded-lg border border-white/5 flex flex-col items-center text-center">
            <span className="text-[10px] text-[#94A3B8] font-mono uppercase">BUILD</span>
            <span className="text-xs font-semibold text-[#0078D4]">Future</span>
          </div>
        </div>

      </div>
    </div>
  );
};
