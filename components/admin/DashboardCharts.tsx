"use client";

import React from "react";
import { BarChart3, PieChart } from "lucide-react";
import { useAdminAuth } from "./AdminAuthProvider";

export const DashboardCharts: React.FC = () => {
  const { officeBearers } = useAdminAuth();

  // Activity Participation Breakdown
  const participationData = [
    { label: "Placement Questions", count: 1850, percentage: 48, color: "bg-[#0078D4]" },
    { label: "General Quiz", count: 1420, percentage: 37, color: "bg-[#22D3EE]" },
    { label: "Feed Community", count: 890, percentage: 23, color: "bg-purple-400" },
    { label: "Technical Games", count: 640, percentage: 17, color: "bg-emerald-400" },
  ];

  // Calculate Office Bearers by Department
  const deptCounts: Record<string, number> = {
    "CSE": 0,
    "IT": 0,
    "ECE": 0,
    "EEE": 0,
    "Other": 0,
  };

  officeBearers.forEach((ob) => {
    if (ob.department.includes("Computer Science")) deptCounts["CSE"]++;
    else if (ob.department.includes("Information")) deptCounts["IT"]++;
    else if (ob.department.includes("Electronics &")) deptCounts["ECE"]++;
    else if (ob.department.includes("Electrical")) deptCounts["EEE"]++;
    else deptCounts["Other"]++;
  });

  const deptColors: Record<string, string> = {
    "CSE": "#0078D4",
    "IT": "#22D3EE",
    "ECE": "#A855F7",
    "EEE": "#10B981",
    "Other": "#F59E0B",
  };

  const totalObs = officeBearers.length || 1;

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
              Total Engagements: 4,800
            </span>
          </div>

          <div className="space-y-4">
            {participationData.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#CBD5E1]">{item.label}</span>
                  <span className="font-mono text-[#94A3B8]">{item.count} participants</span>
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
          <span>Source: MCC Student Activity Engine</span>
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
            {Object.entries(deptCounts).map(([dept, count]) => {
              const pct = Math.round((count / totalObs) * 100);
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
            })}
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
