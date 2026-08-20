"use client";

import React, { useEffect, useState } from "react";
import { Users, UserCheck, Activity, Award, HelpCircle, Code2 } from "lucide-react";
import { useAdminAuth } from "./AdminAuthProvider";

interface DashboardStatsData {
  totalObs: number;
  activeObs: number;
  totalParticipants: number;
  placementAttemptsCount: number;
  quizAttemptsCount: number;
  feedPostsCount: number;
  techGamesCount: number;
  totalProposals: number;
  activeAnnouncements: number;
}

export const DashboardStats: React.FC = () => {
  const { officeBearers, assignments } = useAdminAuth();
  const [liveStats, setLiveStats] = useState<DashboardStatsData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard-stats")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.totalObs === "number") {
          setLiveStats(data);
        }
      })
      .catch((err) => console.error("Error fetching dashboard stats:", err));
  }, [officeBearers.length]);

  const totalObCount = liveStats ? liveStats.totalObs : officeBearers.length;
  const activeObCount = liveStats ? liveStats.activeObs : officeBearers.filter((ob) => ob.status === "Active").length;
  const assignedActivitiesCount = assignments.filter((a) => a.assignmentStatus === "Assigned").length;
  const totalParticipants = liveStats ? liveStats.totalParticipants : 0;
  const placementAttempts = liveStats ? liveStats.placementAttemptsCount : 0;
  const quizAttempts = liveStats ? liveStats.quizAttemptsCount : 0;
  const totalActivities = 4;

  const stats = [
    {
      title: "TOTAL UNIQUE PARTICIPANTS",
      value: totalParticipants > 0 ? `${totalParticipants}` : "0",
      change: totalParticipants > 0 ? "Persisted MongoDB Attempts" : "No student attempts yet",
      icon: Users,
      color: "text-[#0078D4]",
      bgColor: "bg-[#0078D4]/10",
      borderColor: "border-[#0078D4]/20",
    },
    {
      title: "TOTAL OFFICE BEARERS",
      value: `${totalObCount}`,
      change: `${activeObCount} Active`,
      icon: UserCheck,
      color: "text-[#22D3EE]",
      bgColor: "bg-[#22D3EE]/10",
      borderColor: "border-[#22D3EE]/20",
    },
    {
      title: "TOTAL ACTIVITIES",
      value: `${totalActivities}`,
      change: `${assignedActivitiesCount} Assigned Leads`,
      icon: Activity,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      title: "TOTAL TEST ATTEMPTS",
      value: `${placementAttempts + quizAttempts}`,
      change: (placementAttempts + quizAttempts) > 0 ? "Recorded Submissions" : "No submissions yet",
      icon: Award,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
  ];

  const subStats = [
    {
      title: "Placement Question Participants",
      value: placementAttempts > 0 ? `${placementAttempts}` : "0",
      icon: Code2,
    },
    {
      title: "General Quiz Participants",
      value: quizAttempts > 0 ? `${quizAttempts}` : "0",
      icon: HelpCircle,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="p-5 rounded-xl bg-[#0D1B2A] border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all duration-200 shadow-md shadow-black/20"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#94A3B8] font-semibold">
                  {stat.title}
                </span>
                <div
                  className={`w-9 h-9 rounded-lg border ${stat.bgColor} ${stat.borderColor} flex items-center justify-center`}
                >
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight block">
                  {stat.value}
                </span>
                <span className="text-xs text-[#94A3B8] mt-1 block">
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub Activity Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {subStats.map((sub) => {
          const Icon = sub.icon;
          return (
            <div
              key={sub.title}
              className="p-4 rounded-xl bg-[#0D1B2A]/60 border border-white/10 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <Icon className="w-4 h-4 text-[#0078D4]" />
                </div>
                <div>
                  <span className="text-xs font-medium text-[#CBD5E1] block">
                    {sub.title}
                  </span>
                  <span className="text-lg font-bold text-[#F8FAFC]">
                    {sub.value}
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

