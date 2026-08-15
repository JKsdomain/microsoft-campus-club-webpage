import React from "react";
import { QuizConfiguration } from "@/components/office-bearer/QuizConfiguration";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "General Quiz — MCC Office Bearer Panel",
  description: "Configure General Quiz parameters, validate CSV question sets, and submit for approval.",
};

export default function GeneralQuizPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Description */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
          General Quiz
        </h2>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Configure quiz parameters, upload question CSV sets, and submit for Admin approval.
        </p>
      </div>

      {/* Quiz Configuration & CSV Manager */}
      <QuizConfiguration activityType="General Quiz" />
    </div>
  );
}
