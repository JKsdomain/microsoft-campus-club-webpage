"use client";

import React from "react";
import Link from "next/link";
import { Users, CheckCircle2, Clock, ArrowRight, ShieldCheck, AlertCircle, XCircle } from "lucide-react";
import { useOBAuth } from "./OBAuthProvider";
import { Button } from "../ui/Button";
import { LeaderboardPublishCard } from "./LeaderboardPublishCard";

export const OBDashboard: React.FC = () => {
  const { currentOb, submissions, feedPosts } = useOBAuth();
  const respName = currentOb.assignedResponsibility;

  // Filter submissions/posts specifically for this OB's single assigned responsibility
  const relevantSubmissions = submissions.filter((s) => {
    if (respName === "General Quiz") return s.type === "General Quiz";
    if (respName === "Placement Questions") return s.type === "Placement Questions";
    return false;
  });

  const pendingCount = relevantSubmissions.filter((s) => s.status === "Pending Approval").length;
  const approvedCount = relevantSubmissions.filter((s) => s.status === "Approved").length;
  const rejectedCount = relevantSubmissions.filter((s) => s.status === "Rejected").length;

  // Dynamic statistics grid based ONLY on the single assigned responsibility
  const getSingleResponsibilityStats = () => {
    if (respName === "General Quiz") {
      return [
        { title: "PARTICIPANTS", value: "145", sub: "Registered Students", icon: Users, color: "text-[#0078D4]" },
        { title: "ATTENDED", value: "128", sub: "Attempted Quizzes", icon: CheckCircle2, color: "text-blue-400" },
        { title: "COMPLETED", value: "122", sub: "Finished Under Timer", icon: ShieldCheck, color: "text-emerald-400" },
        { title: "PENDING APPROVAL", value: `${pendingCount}`, sub: "Awaiting Admin Review", icon: Clock, color: "text-amber-400" },
        { title: "APPROVED", value: `${approvedCount}`, sub: "Live Quiz Sets", icon: CheckCircle2, color: "text-[#22D3EE]" },
        { title: "REJECTED", value: `${rejectedCount}`, sub: "Needs Revision", icon: XCircle, color: "text-red-400" },
      ];
    }

    if (respName === "Placement Questions") {
      return [
        { title: "PARTICIPANTS", value: "98", sub: "Student Applicants", icon: Users, color: "text-[#0078D4]" },
        { title: "ATTENDED", value: "92", sub: "Started Assessment", icon: CheckCircle2, color: "text-blue-400" },
        { title: "COMPLETED", value: "89", sub: "Reports Generated", icon: ShieldCheck, color: "text-emerald-400" },
        { title: "PENDING APPROVAL", value: `${pendingCount}`, sub: "Awaiting Admin Review", icon: Clock, color: "text-amber-400" },
        { title: "APPROVED", value: `${approvedCount}`, sub: "Active Test Sets", icon: CheckCircle2, color: "text-[#22D3EE]" },
        { title: "REJECTED", value: `${rejectedCount}`, sub: "Needs Revision", icon: XCircle, color: "text-red-400" },
      ];
    }

    if (respName === "Technical Games") {
      return [
        { title: "PARTICIPANT TEAMS", value: "32", sub: "Registered Teams", icon: Users, color: "text-[#0078D4]" },
        { title: "ATTENDED TEAMS", value: "28", sub: "Check-in Complete", icon: CheckCircle2, color: "text-blue-400" },
        { title: "COMPLETED ROUNDS", value: "24", sub: "Evaluated Submissions", icon: ShieldCheck, color: "text-emerald-400" },
        { title: "PENDING APPROVAL", value: `${pendingCount}`, sub: "Awaiting Admin Review", icon: Clock, color: "text-amber-400" },
        { title: "APPROVED GAMES", value: `${approvedCount}`, sub: "Published Arenas", icon: CheckCircle2, color: "text-[#22D3EE]" },
        { title: "REJECTED", value: `${rejectedCount}`, sub: "Returned Drafts", icon: XCircle, color: "text-red-400" },
      ];
    }

    if (respName === "Feed Community") {
      const feedPending = feedPosts.filter((p) => p.status === "Pending Approval").length;
      const feedApproved = feedPosts.filter((p) => p.status === "Approved").length;
      const feedRejected = feedPosts.filter((p) => p.status === "Rejected").length;

      return [
        { title: "TOTAL POSTS CREATED", value: `${feedPosts.length}`, sub: "Community Contributions", icon: Users, color: "text-[#0078D4]" },
        { title: "PENDING APPROVAL", value: `${feedPending}`, sub: "Admin Queue", icon: Clock, color: "text-amber-400" },
        { title: "APPROVED POSTS", value: `${feedApproved}`, sub: "Live on Feed", icon: CheckCircle2, color: "text-emerald-400" },
        { title: "REJECTED POSTS", value: `${feedRejected}`, sub: "Needs Edits", icon: XCircle, color: "text-red-400" },
      ];
    }

    return [];
  };

  const stats = getSingleResponsibilityStats();

  let manageHref = "/office-bearer/dashboard";
  if (respName === "General Quiz") manageHref = "/office-bearer/general-quiz";
  if (respName === "Placement Questions") manageHref = "/office-bearer/placement-questions";
  if (respName === "Technical Games") manageHref = "/office-bearer/technical-games";
  if (respName === "Feed Community") manageHref = "/office-bearer/feed-community";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Badge */}
      <div className="p-4 rounded-xl bg-[#0D1B2A] border border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-[#0078D4]" />
          <div>
            <span className="text-xs text-[#94A3B8] font-mono block">ASSIGNED RESPONSIBILITY</span>
            <span className="text-lg font-bold text-[#F8FAFC]">{respName}</span>
          </div>
        </div>

        {respName !== "Unassigned" && (
          <Link href={manageHref}>
            <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Manage {respName}
            </Button>
          </Link>
        )}
      </div>

      {/* OB Responsibility Specific Statistics Grid */}
      {respName === "Unassigned" ? (
        <div className="p-12 text-center rounded-2xl bg-[#0D1B2A] border border-white/10 text-[#94A3B8]">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#F8FAFC]">No Responsibility Assigned</h3>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-sm mx-auto">
            Your Office Bearer account is currently unassigned. An Administrator must assign exactly one responsibility to your account.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="p-4 rounded-xl bg-[#0D1B2A] border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all shadow-md"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono uppercase text-[#94A3B8] font-semibold tracking-wider">
                    {stat.title}
                  </span>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-bold text-[#F8FAFC] block">
                    {stat.value}
                  </span>
                  <span className="text-[10px] text-[#94A3B8] block mt-0.5">
                    {stat.sub}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Publication Control for Responsible Office Bearer */}
      {(respName === "General Quiz" || respName === "Placement Questions") && (
        <LeaderboardPublishCard
          role="OFFICE_BEARER"
          assignedResponsibility={respName}
          activityType={respName}
        />
      )}

      {/* Submissions / Activity Status Card */}
      {respName !== "Unassigned" && (
        <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-4">
          <div className="pb-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#F8FAFC]">
              {respName} Proposals & Submissions
            </h3>
            <span className="text-xs font-mono text-[#22D3EE]">APPROVAL QUEUE</span>
          </div>

          <div className="space-y-3">
            {relevantSubmissions.length === 0 ? (
              <p className="text-xs text-[#94A3B8] italic py-2">
                No active proposals for {respName}.
              </p>
            ) : (
              relevantSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-xl bg-[#07111F] border border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <span className="font-semibold text-[#F8FAFC] block">
                      {sub.title}
                    </span>
                    <span className="text-[#94A3B8] font-mono block">
                      {sub.csvFileName} • {sub.submittedDate}
                    </span>
                  </div>

                  <div>
                    {sub.status === "Pending Approval" && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pending Approval
                      </span>
                    )}
                    {sub.status === "Approved" && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Approved
                      </span>
                    )}
                    {sub.status === "Rejected" && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
