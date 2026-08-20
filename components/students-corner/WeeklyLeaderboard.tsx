"use client";

import React from "react";
import { Trophy, ShieldAlert, CheckCircle2 } from "lucide-react";

export interface LeaderboardItem {
  rank: number;
  username: string;
  email?: string;
  department?: string;
  year?: string;
  section?: string;
  rollNumber?: string;
  score: number;
  percentage: number;
  totalQuestions?: number;
  testType?: string;
  timestamp?: string;
}

interface WeeklyLeaderboardProps {
  isPublished: boolean;
  entries?: LeaderboardItem[];
  publishedBy?: string | null;
  publishedByRole?: string | null;
  publishedAt?: string | null;
  weekNumber?: number;
}

export const WeeklyLeaderboard: React.FC<WeeklyLeaderboardProps> = ({
  isPublished,
  entries = [],
  publishedBy,
  publishedByRole,
  publishedAt,
  weekNumber = 1,
}) => {
  if (!isPublished) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#0D1B2A] border border-white/10 max-w-xl mx-auto space-y-4 animate-fade-in shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-[#F8FAFC]">
            PLACEMENT QUESTIONS LEADERBOARD
          </h3>
          <p className="text-sm font-semibold text-amber-400">
            Leaderboard will be available once it is published.
          </p>
          <p className="text-xs text-[#CBD5E1] pt-1">
            Results are currently under evaluation. Please check back soon after the official rankings are published by the Administrator or Placement Office Bearer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Leaderboard Banner Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#0D1B2A] via-[#07111F] to-[#0078D4]/20 border border-white/10 shadow-2xl flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h3 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">
              Placement Questions Leaderboard
            </h3>
          </div>
          <p className="text-xs text-[#CBD5E1]">
            Official MCC Placement Assessment Rankings • Week {weekNumber}
            {publishedBy && (
              <span className="text-[#94A3B8] block mt-0.5">
                Published by <strong className="text-white">{publishedBy}</strong> ({publishedByRole === "ADMIN" ? "Administrator" : "Placement Lead"}){publishedAt ? ` • ${new Date(publishedAt).toLocaleDateString()}` : ""}
              </span>
            )}
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Official & Live</span>
        </span>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#CBD5E1]">
            <thead className="bg-[#07111F] border-b border-white/10 text-[11px] font-mono text-[#94A3B8] uppercase">
              <tr>
                <th className="py-4 px-6">Rank</th>
                <th className="py-4 px-6">Student</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6">Score Points</th>
                <th className="py-4 px-6 text-right">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[#94A3B8] italic">
                    No placement results available yet.
                  </td>
                </tr>
              ) : (
                entries.map((item) => (
                  <tr
                    key={item.rank}
                    className={`hover:bg-white/[0.03] transition-colors ${
                      item.rank === 1 ? "bg-amber-500/5" : ""
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {item.rank === 1 && (
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs">
                            🥇 1
                          </div>
                        )}
                        {item.rank === 2 && (
                          <div className="w-7 h-7 rounded-lg bg-slate-300/20 border border-slate-300/30 flex items-center justify-center text-slate-200 font-bold text-xs">
                            🥈 2
                          </div>
                        )}
                        {item.rank === 3 && (
                          <div className="w-7 h-7 rounded-lg bg-amber-700/20 border border-amber-700/30 flex items-center justify-center text-amber-500 font-bold text-xs">
                            🥉 3
                          </div>
                        )}
                        {item.rank > 3 && (
                          <span className="w-7 h-7 flex items-center justify-center font-mono text-xs text-[#94A3B8]">
                            #{item.rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-[#F8FAFC]">
                        {item.username}
                      </div>
                      {item.rollNumber && item.rollNumber !== "N/A" && (
                        <span className="text-[11px] text-[#94A3B8] font-mono block">
                          Roll: {item.rollNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-[#CBD5E1]">
                      {item.department || "General"}
                    </td>
                    <td className="py-4 px-6 font-mono text-[#22D3EE]">
                      {item.score} pts
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-emerald-400">
                      {item.percentage}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


