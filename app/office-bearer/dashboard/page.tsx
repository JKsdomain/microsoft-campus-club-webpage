import React from "react";
import { OBDashboard } from "@/components/office-bearer/OBDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OB Dashboard — Microsoft Campus Club",
  description: "Overview of your assigned MCC activities and leadership responsibilities.",
};

export default function OBDashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Description */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
          Dashboard
        </h2>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Overview of your assigned MCC activities
        </p>
      </div>

      {/* OB Dashboard Content */}
      <OBDashboard />
    </div>
  );
}
