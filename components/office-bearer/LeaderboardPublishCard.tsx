"use client";

import React, { useState, useEffect } from "react";
import { Trophy, CheckCircle2, ShieldAlert, Globe, Lock, RefreshCw, Download, FileSpreadsheet } from "lucide-react";
import { Button } from "../ui/Button";

interface LeaderboardPublishCardProps {
  role: "ADMIN" | "OFFICE_BEARER";
  activityType?: string;
  assignedResponsibility?: string;
}

export const LeaderboardPublishCard: React.FC<LeaderboardPublishCardProps> = ({
  role,
  activityType,
  assignedResponsibility,
}) => {
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [publishedBy, setPublishedBy] = useState<string | null>(null);
  const [publishedByRole, setPublishedByRole] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [weekNumber, setWeekNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [downloadingExcel, setDownloadingExcel] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setIsPublished(Boolean(data.isPublished));
        setPublishedBy(data.publishedBy || null);
        setPublishedByRole(data.publishedByRole || null);
        setPublishedAt(data.publishedAt || null);
        setWeekNumber(data.weekNumber || 1);
      }
    } catch (err: any) {
      console.error("Failed to load leaderboard status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTogglePublish = async () => {
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const newAction = isPublished ? "unpublish" : "publish";
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: newAction,
          activityType: "Placement Questions",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update publication status.");
      }

      setIsPublished(Boolean(data.isPublished));
      setPublishedBy(data.publishedBy || null);
      setPublishedByRole(data.publishedByRole || null);
      setPublishedAt(data.publishedAt || null);
    } catch (err: any) {
      setErrorMsg(err.message || "Action failed. Please check permissions.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    setErrorMsg(null);
    try {
      const exportType = activityType || "Placement Questions";
      const res = await fetch(`/api/leaderboard/export?type=${encodeURIComponent(exportType)}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to download Excel report.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = (activityType || "Placement").replace(/\s+/g, "_");
      a.download = `MCC_${safeTitle}_Leaderboard_Week_${weekNumber}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setErrorMsg(err.message || "Error downloading Excel file.");
    } finally {
      setDownloadingExcel(false);
    }
  };

  const isQuiz = (activityType || "").toLowerCase().includes("quiz");
  const isObAuthorized =
    role === "ADMIN" ||
    (isQuiz
      ? (assignedResponsibility || "").toLowerCase().includes("quiz") || (assignedResponsibility || "").toLowerCase().includes("general")
      : (assignedResponsibility || "").toLowerCase().includes("placement"));

  const handleResetLeaderboard = async () => {
    if (!window.confirm("Are you sure you want to reset the leaderboard for a new placement round? This will advance the round/week number and unpublish current rankings until the new round completes.")) {
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset leaderboard.");
      setIsPublished(false);
      setWeekNumber(data.weekNumber || (weekNumber + 1));
      alert(`Leaderboard reset successfully for Round/Week ${data.weekNumber || (weekNumber + 1)}.`);
    } catch (err: any) {
      setErrorMsg(err.message || "Reset failed.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-4">
      <div className="pb-3 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F8FAFC]">
              Placement Leaderboard Publication Control (Week {weekNumber})
            </h3>
            <p className="text-xs text-[#94A3B8]">
              Manage public visibility, reset rounds, and download official Placement assessment rankings.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isPublished ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Globe className="w-3.5 h-3.5" />
              Published & Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock className="w-3.5 h-3.5" />
              Unpublished (Private)
            </span>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#07111F] border border-white/5">
        <div className="space-y-1 text-xs">
          <div className="text-[#CBD5E1]">
            Status:{" "}
            {isPublished ? (
              <span className="text-emerald-400 font-semibold">Publicly visible to students in Students Corner</span>
            ) : (
              <span className="text-amber-400 font-semibold">Hidden from students</span>
            )}
          </div>
          {isPublished && publishedBy && (
            <div className="text-[11px] font-mono text-[#94A3B8]">
              Published by <strong className="text-[#F8FAFC]">{publishedBy}</strong> (
              {publishedByRole === "ADMIN" ? "Administrator" : "Placement Lead"})
              {publishedAt && ` • ${new Date(publishedAt).toLocaleString()}`}
            </div>
          )}
          {!isPublished && (
            <div className="text-[11px] text-[#94A3B8]">
              Students see &quot;Leaderboard will be available once it is published.&quot;
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Excel Download Button */}
          {isObAuthorized && (
            <Button
              variant="outline"
              size="sm"
              disabled={downloadingExcel || loading}
              onClick={handleDownloadExcel}
              leftIcon={
                downloadingExcel ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0078D4]" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                )
              }
            >
              {downloadingExcel ? "Generating .xlsx..." : "Download Excel (.xlsx)"}
            </Button>
          )}

          {/* Reset Leaderboard Round Button */}
          {isObAuthorized && (
            <Button
              variant="outline"
              size="sm"
              disabled={actionLoading || loading}
              onClick={handleResetLeaderboard}
              className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Reset Round
            </Button>
          )}

          {/* Publish / Unpublish Toggle Button */}
          {isObAuthorized ? (
            <Button
              variant="primary"
              size="sm"
              disabled={actionLoading || loading}
              onClick={handleTogglePublish}
              className={
                isPublished
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }
              leftIcon={
                actionLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : isPublished ? (
                  <Lock className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )
              }
            >
              {actionLoading
                ? "Updating..."
                : isPublished
                ? "Unpublish Leaderboard"
                : "Publish Leaderboard"}
            </Button>
          ) : (
            <span className="text-xs text-[#94A3B8] italic">
              Publishing is restricted to Admin & Placement Questions OB.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

