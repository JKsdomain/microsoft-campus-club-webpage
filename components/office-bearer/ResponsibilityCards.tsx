"use client";

import React from "react";
import Link from "next/link";
import { CircleHelp, BriefcaseBusiness, Gamepad2, Users, ArrowRight, ShieldCheck } from "lucide-react";
import { useOBAuth } from "./OBAuthProvider";
import { Button } from "../ui/Button";

export const ResponsibilityCards: React.FC = () => {
  const { currentOb } = useOBAuth();
  const respName = currentOb.assignedResponsibility;

  const RESPONSIBILITY_METADATA: Record<
    string,
    {
      description: string;
      href: string;
      icon: React.ComponentType<{ className?: string }>;
      metrics: { label: string; value: string }[];
    }
  > = {
    "General Quiz": {
      description: "Configure interactive trivia questions, upload question CSV sets, set timers, and submit for Admin approval.",
      href: "/office-bearer/general-quiz",
      icon: CircleHelp,
      metrics: [
        { label: "Questions Uploaded", value: "25 Questions" },
        { label: "Active Participants", value: "120 Students" },
      ],
    },
    "Placement Questions": {
      description: "Manage interview-level coding and aptitude challenge sets, validate question CSV structures, and submit for approval.",
      href: "/office-bearer/placement-questions",
      icon: BriefcaseBusiness,
      metrics: [
        { label: "Challenge Sets", value: "15 Problems" },
        { label: "Submissions Evaluated", value: "95 Students" },
      ],
    },
    "Technical Games": {
      description: "Coordinate hands-on micro-challenges, technical gaming rounds, and hardware speed coding events.",
      href: "https://technical-game-homepage.vercel.app/#games",
      icon: Gamepad2,
      metrics: [
        { label: "Active Events", value: "2 Games" },
        { label: "Registrations", value: "64 Teams" },
      ],
    },
    "Feed Community": {
      description: "Compose community updates, project spotlights, and student announcements for the common MCC Feed.",
      href: "/office-bearer/feed-community",
      icon: Users,
      metrics: [
        { label: "Posts Drafted", value: "4 Posts" },
        { label: "Community Engagements", value: "890 Views" },
      ],
    },
  };

  const meta = respName !== "Unassigned" ? RESPONSIBILITY_METADATA[respName] : null;

  return (
    <div className="space-y-6">
      {!meta ? (
        <div className="p-12 text-center rounded-2xl bg-[#0D1B2A] border border-white/10 text-[#94A3B8]">
          <ShieldCheck className="w-12 h-12 text-[#94A3B8] mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-bold text-[#F8FAFC]">No Responsibility Assigned</h3>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-sm mx-auto">
            You currently have no MCC activities assigned to your account. Contact an Administrator to request activity assignment.
          </p>
        </div>
      ) : (
        <div className="max-w-xl">
          {(() => {
            const Icon = meta.icon;

            return (
              <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl shadow-black/20 flex flex-col justify-between hover:border-[#0078D4]/40 transition-all duration-200">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-[#0078D4]/10 border border-[#0078D4]/20 text-[#22D3EE]">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-[#F8FAFC]">
                        {respName}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Assigned
                    </span>
                  </div>

                  <p className="text-xs text-[#CBD5E1] leading-relaxed mb-6">
                    {meta.description}
                  </p>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#07111F] border border-white/10 text-xs mb-6">
                    {meta.metrics.map((m) => (
                      <div key={m.label}>
                        <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">
                          {m.label}
                        </span>
                        <span className="font-semibold text-[#F8FAFC]">
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end">
                  <Link href={meta.href}>
                    <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Manage Module
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
