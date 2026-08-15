import React from "react";
import { ResponsibilityCards } from "@/components/office-bearer/ResponsibilityCards";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Responsibilities — MCC Office Bearer Panel",
  description: "View and manage your assigned MCC platform activities and leadership modules.",
};

export default function ResponsibilitiesPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Description */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
          My Responsibilities
        </h2>
        <p className="text-sm text-[#CBD5E1] mt-1">
          View and manage all MCC activities assigned to your account.
        </p>
      </div>

      {/* Responsibility Modules Grid */}
      <ResponsibilityCards />
    </div>
  );
}
