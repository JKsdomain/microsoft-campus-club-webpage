import React from "react";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { SystemHealthOverview } from "@/components/admin/SystemHealthOverview";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard — Microsoft Campus Club",
  description: "Administrative overview of the MCC platform.",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Description */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
          Dashboard
        </h2>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Overview of the MCC platform
        </p>
      </div>

      {/* Summary Statistics Grid */}
      <DashboardStats />

      {/* System Health Overview */}
      <SystemHealthOverview />

      {/* Analytics Charts Grid */}
      <DashboardCharts />
    </div>
  );
}
