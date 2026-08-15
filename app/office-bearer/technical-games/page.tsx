import React from "react";
import { TechnicalGamesManager } from "@/components/office-bearer/TechnicalGamesManager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Technical Games — MCC Office Bearer Panel",
  description: "Setup technical gaming challenge sets and submit for Admin approval.",
};

export default function TechnicalGamesPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Description */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
          Technical Games
        </h2>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Coordinate hands-on technical micro-challenges and gaming events.
        </p>
      </div>

      {/* Technical Games Arena Manager */}
      <TechnicalGamesManager />
    </div>
  );
}
