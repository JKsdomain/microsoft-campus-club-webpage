"use client";

import React, { useState, useEffect } from "react";
import {
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileClock,
  ClipboardList,
  Trophy,
  Megaphone,
  Rss,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CleanupCounts {
  proposals: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    archived: number;
  };
  auditLogs: {
    total: number;
  };
  testAttempts: {
    total: number;
  };
  announcements: {
    total: number;
  };
  feeds: {
    total: number;
  };
}

export default function AdminDataCleanupPage() {
  const [counts, setCounts] = useState<CleanupCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [purgingTarget, setPurgingTarget] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    target: string;
    title: string;
    description: string;
    subFilter?: string;
    olderThanDays?: number;
  } | null>(null);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/data-cleanup");
      if (res.ok) {
        const data = await res.json();
        setCounts(data.counts);
      }
    } catch (e) {
      console.error("Failed to load collection counts", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const handleExecutePurge = async () => {
    if (!confirmModal) return;
    const { target, subFilter, olderThanDays } = confirmModal;
    setPurgingTarget(target);
    setFeedback(null);
    setConfirmModal(null);

    try {
      const res = await fetch("/api/admin/data-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, subFilter, olderThanDays }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", text: data.message });
        await fetchCounts();
      } else {
        setFeedback({ type: "error", text: data.message || "Failed to purge data." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Network error occurred." });
    } finally {
      setPurgingTarget(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase tracking-wider text-red-400">
              Admin System Tools
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/20">
              Permanent Deletion
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight mt-1">
            Data Cleanup & System Reset
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Safely purge outdated proposals, audit logs, student test attempts, feeds, or reset specific section databases.
          </p>
        </div>

        <Button
          onClick={fetchCounts}
          disabled={loading}
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
        >
          Refresh Counts
        </Button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center space-x-2 border ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Safety Notice */}
      <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-amber-500/20 text-xs text-[#CBD5E1] space-y-1">
        <div className="flex items-center space-x-2 text-amber-400 font-bold">
          <ShieldAlert className="w-4 h-4" />
          <span>Administrative Safeguard Warning</span>
        </div>
        <p className="leading-relaxed">
          Deleting records from this page performs permanent database removal from MongoDB Atlas. Office Bearer accounts and core configurations are preserved. Always ensure critical data or rankings are exported before purging.
        </p>
      </div>

      {/* Grid of Cleanup Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Approval Workflow & Proposals */}
        <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#0078D4]/10 text-[#0078D4]">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#F8FAFC] text-base">Proposals & Approvals</h3>
                <p className="text-xs text-[#94A3B8]">
                  Total: <strong className="text-white">{counts?.proposals.total ?? "—"}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono p-3 rounded-xl bg-[#07111F] border border-white/5">
            <div>
              <span className="text-[#94A3B8] block text-[9px] uppercase">Pending</span>
              <span className="text-amber-400 font-bold">{counts?.proposals.pending ?? 0}</span>
            </div>
            <div>
              <span className="text-[#94A3B8] block text-[9px] uppercase">Approved</span>
              <span className="text-emerald-400 font-bold">{counts?.proposals.approved ?? 0}</span>
            </div>
            <div>
              <span className="text-[#94A3B8] block text-[9px] uppercase">Rejected</span>
              <span className="text-red-400 font-bold">{counts?.proposals.rejected ?? 0}</span>
            </div>
            <div>
              <span className="text-[#94A3B8] block text-[9px] uppercase">Archived</span>
              <span className="text-purple-400 font-bold">{counts?.proposals.archived ?? 0}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10 text-xs"
              onClick={() =>
                setConfirmModal({
                  target: "proposals",
                  subFilter: "ARCHIVED",
                  title: "Delete All Archived Proposals?",
                  description: "This will permanently remove all historical archived proposals from MongoDB.",
                })
              }
            >
              Clear Archived Only
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs"
              onClick={() =>
                setConfirmModal({
                  target: "proposals",
                  subFilter: "REJECTED",
                  title: "Delete All Rejected Proposals?",
                  description: "This will permanently remove all rejected proposals.",
                })
              }
            >
              Clear Rejected Only
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs"
              onClick={() =>
                setConfirmModal({
                  target: "proposals",
                  title: "Delete ALL Proposals?",
                  description: "WARNING: This will delete all pending, approved, rejected, and archived proposals.",
                })
              }
            >
              Delete All Proposals
            </Button>
          </div>
        </div>

        {/* 2. Audit Logs */}
        <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <FileClock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#F8FAFC] text-base">Audit & Activity Logs</h3>
                <p className="text-xs text-[#94A3B8]">
                  Total Recorded: <strong className="text-white">{counts?.auditLogs.total ?? "—"}</strong>
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#CBD5E1] leading-relaxed">
            System logs recording admin approvals, logins, proposal edits, and student attempts.
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-purple-400 border-purple-500/30 hover:bg-purple-500/10 text-xs"
              onClick={() =>
                setConfirmModal({
                  target: "auditLogs",
                  olderThanDays: 30,
                  title: "Purge Logs Older Than 30 Days?",
                  description: "This will delete historical audit log entries older than 30 days while keeping recent logs.",
                })
              }
            >
              Purge Older Than 30 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs"
              onClick={() =>
                setConfirmModal({
                  target: "auditLogs",
                  title: "Wipe All Audit Logs?",
                  description: "This will delete ALL recorded audit log events from the database.",
                })
              }
            >
              Wipe All Logs
            </Button>
          </div>
        </div>

        {/* 3. Test Attempts & Leaderboard */}
        <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#F8FAFC] text-base">Student Test Attempts & Leaderboard</h3>
                <p className="text-xs text-[#94A3B8]">
                  Total Attempts: <strong className="text-white">{counts?.testAttempts.total ?? "—"}</strong>
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#CBD5E1] leading-relaxed">
            Student test responses for Placement Questions and General Quiz rounds.
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10 text-xs"
              onClick={() =>
                setConfirmModal({
                  target: "testAttempts",
                  subFilter: "with_leaderboard_reset",
                  title: "Clear All Attempts & Reset Leaderboard?",
                  description: "This will delete all student test submissions and unpublish the leaderboard for a fresh round.",
                })
              }
            >
              Clear Attempts & Reset Leaderboard
            </Button>
          </div>
        </div>

        {/* 4. Feed Community */}
        <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Rss className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#F8FAFC] text-base">Community Feed Posts</h3>
                <p className="text-xs text-[#94A3B8]">
                  Total Posts: <strong className="text-white">{counts?.feeds.total ?? "—"}</strong>
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#CBD5E1] leading-relaxed">
            All announcements, text posts, and media shared in the Office Bearer community feed.
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs"
              onClick={() =>
                setConfirmModal({
                  target: "feeds",
                  title: "Delete All Feed Posts?",
                  description: "This will permanently remove all feed posts and their media links from MongoDB.",
                })
              }
            >
              Delete All Feed Posts
            </Button>
          </div>
        </div>

        {/* 5. Announcements */}
        <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#F8FAFC] text-base">Official Announcements</h3>
                <p className="text-xs text-[#94A3B8]">
                  Total Notices: <strong className="text-white">{counts?.announcements.total ?? "—"}</strong>
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-[#CBD5E1] leading-relaxed">
            Notices displayed on the landing page announcement banner and announcements tab.
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs"
              onClick={() =>
                setConfirmModal({
                  target: "announcements",
                  title: "Delete All Announcements?",
                  description: "This will permanently delete all published and draft announcements.",
                })
              }
            >
              Delete All Announcements
            </Button>
          </div>
        </div>

        {/* 6. Complete System Wipe */}
        <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/30 shadow-xl space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-red-300 text-base">Complete Data Purge (Fresh Start)</h3>
              <p className="text-xs text-[#94A3B8]">
                Wipe all proposals, attempts, logs, feeds, and notices at once.
              </p>
            </div>
          </div>

          <p className="text-xs text-[#CBD5E1] leading-relaxed">
            Resets all operational datasets to a fresh, clean state while preserving Office Bearer and Admin accounts.
          </p>

          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white text-xs w-full sm:w-auto"
              onClick={() =>
                setConfirmModal({
                  target: "all",
                  title: "WIPE ALL PLATFORM ACTIVITY DATA?",
                  description: "CRITICAL: This will permanently delete ALL proposals, student test attempts, audit logs, feed posts, and announcements. This cannot be undone.",
                })
              }
            >
              Execute Complete System Wipe
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0D1B2A] border border-red-500/30 p-6 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#F8FAFC]">{confirmModal.title}</h3>
              <p className="text-xs text-[#CBD5E1] leading-relaxed">{confirmModal.description}</p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setConfirmModal(null)}
                disabled={purgingTarget !== null}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleExecutePurge}
                disabled={purgingTarget !== null}
                leftIcon={purgingTarget ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              >
                {purgingTarget ? "Purging..." : "Confirm & Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
