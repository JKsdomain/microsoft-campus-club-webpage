import React from "react";
import { QuizConfiguration } from "@/components/office-bearer/QuizConfiguration";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Placement Questions — MCC Office Bearer Panel",
  description: "Manage Placement Question sets, validate CSV files, and submit for Admin approval.",
};

export default function PlacementQuestionsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Description */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
          Placement Questions
        </h2>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Manage interview-level coding & aptitude question sets, validate CSV files, and submit for Admin approval.
        </p>
      </div>

      {/* Placement Questions Configuration & CSV Manager */}
      <QuizConfiguration activityType="Placement Questions" />
    </div>
  );
}
