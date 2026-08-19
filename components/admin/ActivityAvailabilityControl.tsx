"use client";

import React from "react";
import { Sliders, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useAdminAuth } from "./AdminAuthProvider";
import { ActivityAvailabilityStatus } from "@/lib/adminState";

const ACTIVITIES = [
  { id: "Placement Questions", label: "Placement Questions", desc: "Weekly student assessment and technical problem sets." },
  { id: "General Quiz", label: "General Quiz", desc: "Speed trivia rounds covering cloud, AI, and developer concepts." },
  { id: "Technical Games", label: "Technical Games", desc: "Hands-on micro-challenges and IoT debugging arenas." },
];

import { LeaderboardPublishCard } from "../office-bearer/LeaderboardPublishCard";

export const ActivityAvailabilityControl: React.FC = () => {
  const { activityAvailability, updateActivityAvailability } = useAdminAuth();

  return (
    <div className="space-y-6">
      {/* Activity Availability Box */}
      <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-6">
        <div className="pb-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Sliders className="w-5 h-5 text-[#0078D4]" />
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Activity Availability Control
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Manage public availability for student activities in Students Corner.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-[#22D3EE] bg-[#22D3EE]/10 px-2.5 py-0.5 rounded-full border border-[#22D3EE]/20">
            PUBLIC STATUS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ACTIVITIES.map((act) => {
            const currentStatus: ActivityAvailabilityStatus =
              activityAvailability[act.id] || (act.id === "Technical Games" ? "COMING SOON" : "OPEN");

            return (
              <div
                key={act.id}
                className="p-4 rounded-xl bg-[#07111F] border border-white/10 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#F8FAFC]">{act.label}</span>
                    {currentStatus === "OPEN" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        OPEN
                      </span>
                    )}
                    {currentStatus === "CLOSED" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                        <XCircle className="w-3 h-3" />
                        CLOSED
                      </span>
                    )}
                    {currentStatus === "COMING SOON" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <Clock className="w-3 h-3" />
                        COMING SOON
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{act.desc}</p>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#94A3B8] mb-1">
                    Availability Status
                  </label>
                  <select
                    value={currentStatus}
                    onChange={(e) =>
                      updateActivityAvailability(act.id, e.target.value as ActivityAvailabilityStatus)
                    }
                    className="w-full text-xs bg-[#0D1B2A] border border-white/15 text-[#F8FAFC] rounded-lg p-2 focus:outline-none focus:border-[#0078D4]"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="COMING SOON">COMING SOON</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Publication Control for Admin */}
      <LeaderboardPublishCard role="ADMIN" />
    </div>
  );
};
