"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, PieChart } from "lucide-react";
import { useAdminAuth } from "./AdminAuthProvider";

interface StatsData {
  placementAttemptsCount: number;
  quizAttemptsCount: number;
  feedPostsCount: number;
  techGamesCount: number;
  deptCounts?: Record<string, number>;
}

export const DashboardCharts: React.FC = () => {
  const { officeBearers } = useAdminAuth();
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard-stats")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.placementAttemptsCount === "number") {
          setStats(data);
        }
      })
      .catch((err) => console.error("Error fetching chart data:", err));
  }, []);

  const placementCount = stats ? stats.placementAttemptsCount : 0;
  const quizCount = stats ? stats.quizAttemptsCount : 0;
  const feedCount = stats ? stats.feedPostsCount : 0;
  const techGamesCount = stats ? stats.techGamesCount : 0;

  const totalEngagements = placementCount + quizCount + feedCount + techGamesCount;
  const maxVal = Math.max(placementCount, quizCount, feedCount, techGamesCount, 1);

  // Activity Participation Breakdown from real MongoDB attempts/posts
  const participationData = [
    {
      label: "Placement Questions",
      count: placementCount,
      percentage: totalEngagements > 0 ? Math.round((placementCount / maxVal) * 100) : 0,
      color: "bg-[#0078D4]",
    },
    {
      label: "General Quiz",
      count: quizCount,
      percentage: totalEngagements > 0 ? Math.round((quizCount / maxVal) * 100) : 0,
      color: "bg-[#22D3EE]",
    },
    {
      label: "Feed Community",
      count: feedCount,
      percentage: totalEngagements > 0 ? Math.round((feedCount / maxVal) * 100) : 0,
      color: "bg-purple-400",
    },
    {
      label: "Technical Games",
      count: techGamesCount,
      percentage: totalEngagements > 0 ? Math.round((techGamesCount / maxVal) * 100) : 0,
      color: "bg-emerald-400",
    },
  ];

  // Calculate Office Bearers by Department from live OBs list
  const deptCounts: Record<string, number> = {
    CSE: 0,
    IT: 0,
    ECE: 0,
    EEE: 0,
    Other: 0,
  };

  officeBearers.forEach((ob) => {
    const dept = ob && ob.department ? String(ob.department) : "";
    if (dept.includes("Computer Science") || dept.includes("CSE") || dept.includes("Artificial Intelligence")) deptCounts["CSE"]++;
    else if (dept.includes("Information") || dept.includes("IT")) deptCounts["IT"]++;
    else if (dept.includes("Electronics") || dept.includes("ECE")) deptCounts["ECE"]++;
    else if (dept.includes("Electrical") || dept.includes("EEE")) deptCounts["EEE"]++;
    else deptCounts["Other"]++;
  });

  const deptColors: Record<string, string> = {
    CSE: "#0078D4",
    IT: "#22D3EE",
    ECE: "#A855F7",
    EEE: "#10B981",
    Other: "#F59E0B",
  };

  const totalObs = officeBearers.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chart 1: Activity Participation (Bar Visualization) */}
      <div className="p-6 rounded-xl bg-[#0D1B2A] border border-white/10 shadow-md shadow-black/20 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-[#0078D4]" />
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Activity Participation
              </h3>
            </div>
            <span className="text-xs font-mono text-[#94A3B8]">
              Total Engagements: {totalEngagements}
            </span>
          </div>

          <div className="space-y-4">
            {participationData.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#CBD5E1]">{item.label}</span>
                  <span className="font-mono text-[#94A3B8]">{item.count} {item.count === 1 ? "participant" : "participants"}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-[#07111F] overflow-hidden p-0.5 border border-white/5">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 mt-6 flex items-center justify-between text-xs text-[#94A3B8]">
          <span>Source: MongoDB Atlas TestAttempt Collection</span>
          <span className="text-[#0078D4] font-medium">Updated Realtime</span>
        </div>
      </div>

      {/* Chart 2: Office Bearer Distribution by Department (Doughnut Visualization) */}
      <div className="p-6 rounded-xl bg-[#0D1B2A] border border-white/10 shadow-md shadow-black/20 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-[#22D3EE]" />
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Office Bearers by Department
              </h3>
            </div>
            <span className="text-xs font-mono text-[#94A3B8]">
              Total OBs: {totalObs}
            </span>
          </div>

          {/* Department Breakdown List */}
          <div className="space-y-3.5">
            {totalObs === 0 ? (
              <div className="p-4 rounded-lg bg-[#07111F]/60 border border-white/5 text-center text-xs text-[#94A3B8]">
                No office bearers found in database.
              </div>
            ) : (
              Object.entries(deptCounts).map(([dept, count]) => {
                const pct = totalObs > 0 ? Math.round((count / totalObs) * 100) : 0;
                return (
                  <div
                    key={dept}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#07111F]/60 border border-white/5"
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: deptColors[dept] }}
                      />
                      <span className="text-xs font-semibold text-[#F8FAFC]">
                        {dept} Department
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-xs font-mono">
                      <span className="text-[#CBD5E1]">{count} OBs</span>
                      <span className="text-[#94A3B8] font-bold">{pct}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 mt-6 flex items-center justify-between text-xs text-[#94A3B8]">
          <span>Faculty & Departmental Governance</span>
          <span className="text-[#22D3EE] font-medium">Verified Active</span>
        </div>
      </div>
    </div>
  );
};

