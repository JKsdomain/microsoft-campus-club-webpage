import React from "react";
import { ResponsibilityAssignment } from "@/components/admin/ResponsibilityAssignment";
import { ActivityAvailabilityControl } from "@/components/admin/ActivityAvailabilityControl";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Responsibility Management — MCC Admin Panel",
  description: "Assign Office Bearers to MCC activities and core modules.",
};

export default function ResponsibilityManagementPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Description */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
          Responsibility & Activity Availability
        </h2>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Assign Office Bearers to MCC activities and control public activity availability.
        </p>
      </div>

      {/* Activity Availability Control */}
      <ActivityAvailabilityControl />

      {/* Responsibility Matrix */}
      <ResponsibilityAssignment />
    </div>
  );
}
