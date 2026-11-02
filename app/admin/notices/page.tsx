"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  X,
  ExternalLink,
  Filter,
  Megaphone,
  UserCheck,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface NoticeItem {
  id: string;
  title: string;
  noticeType: string;
  eventId: string | null;
  eventName: string | null;
  obId: string;
  obName: string;
  contentData: any;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "PUBLISHED" | "REJECTED" | "UNPUBLISHED";
  rejectionReason?: string | null;
  createdAt: string;
  publishedAt?: string | null;
  pdfUrl: string;
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING_APPROVAL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Rejection modal
  const [rejectingNotice, setRejectingNotice] = useState<NoticeItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Preview modal
  const [previewNotice, setPreviewNotice] = useState<NoticeItem | null>(null);

  const loadNotices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notices");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.notices)) {
          setNotices(data.notices);
        }
      }
    } catch (e) {
      console.error("Failed to load admin notices:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handleReviewAction = async (noticeId: string, action: "APPROVE" | "REJECT" | "UNPUBLISH" | "DELETE", reason?: string) => {
    try {
      setIsProcessingAction(true);
      const res = await fetch("/api/admin/notices/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noticeId, action, rejectionReason: reason }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotification({ text: data.message || `Action ${action} successful.`, type: "success" });
        setTimeout(() => setNotification(null), 4500);
        setRejectingNotice(null);
        setRejectionReason("");
        await loadNotices();
      } else {
        const err = await res.json().catch(() => ({}));
        setNotification({ text: err.message || "Failed to process review action.", type: "error" });
      }
    } catch (e: any) {
      setNotification({ text: e.message || "Network error occurred.", type: "error" });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const filteredNotices = notices.filter((n) => {
    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "PENDING_APPROVAL"
        ? n.status === "PENDING_APPROVAL"
        : statusFilter === "PUBLISHED"
        ? n.status === "PUBLISHED" || n.status === "APPROVED"
        : statusFilter === "REJECTED"
        ? n.status === "REJECTED"
        : n.status === statusFilter;

    const matchesType = typeFilter === "ALL" ? true : n.noticeType === typeFilter;
    return matchesStatus && matchesType;
  });

  const pendingCount = notices.filter((n) => n.status === "PENDING_APPROVAL").length;
  const publishedCount = notices.filter((n) => n.status === "PUBLISHED" || n.status === "APPROVED").length;
  const rejectedCount = notices.filter((n) => n.status === "REJECTED").length;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center space-x-3 ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0078D4]/10 border border-[#0078D4]/30 text-xs font-semibold text-[#0078D4] uppercase tracking-wider mb-2">
            <Megaphone className="w-3.5 h-3.5" />
            <span>OFFICIAL NOTICE MANAGEMENT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
            Notice Approvals &amp; Management
          </h1>
          <p className="text-sm text-[#CBD5E1] mt-1">
            Review notices submitted by Office Bearers, preview dynamic PDF templates, approve to publish, or reject with feedback.
          </p>
        </div>

        <button
          onClick={loadNotices}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#0D1B2A] border border-white/10 hover:border-white/20 text-[#CBD5E1] hover:text-white flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0078D4]" : ""}`} />
          <span>Refresh Notices</span>
        </button>
      </div>

      {/* Stat Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter("PENDING_APPROVAL")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "PENDING_APPROVAL"
              ? "bg-[#0D1B2A] border-amber-500/50 shadow-lg shadow-amber-500/10"
              : "bg-[#0D1B2A]/60 border-white/10 hover:border-white/20"
          }`}
        >
          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 block">
            PENDING REVIEW
          </span>
          <span className="text-2xl font-bold text-white mt-1 block">
            {pendingCount}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("PUBLISHED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "PUBLISHED"
              ? "bg-[#0D1B2A] border-emerald-500/50 shadow-lg shadow-emerald-500/10"
              : "bg-[#0D1B2A]/60 border-white/10 hover:border-white/20"
          }`}
        >
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 block">
            PUBLISHED (LIVE)
          </span>
          <span className="text-2xl font-bold text-white mt-1 block">
            {publishedCount}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("REJECTED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "REJECTED"
              ? "bg-[#0D1B2A] border-red-500/50 shadow-lg shadow-red-500/10"
              : "bg-[#0D1B2A]/60 border-white/10 hover:border-white/20"
          }`}
        >
          <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 block">
            REJECTED
          </span>
          <span className="text-2xl font-bold text-white mt-1 block">
            {rejectedCount}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-[#0D1B2A] border-[#0078D4]/50 shadow-lg shadow-[#0078D4]/10"
              : "bg-[#0D1B2A]/60 border-white/10 hover:border-white/20"
          }`}
        >
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#22D3EE] block">
            TOTAL NOTICES
          </span>
          <span className="text-2xl font-bold text-white mt-1 block">
            {notices.length}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Type Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: "PENDING_APPROVAL", label: `Pending Review (${pendingCount})` },
            { key: "PUBLISHED", label: `Published (${publishedCount})` },
            { key: "REJECTED", label: `Rejected (${rejectedCount})` },
            { key: "ALL", label: `All (${notices.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === tab.key
                  ? "bg-[#0078D4] text-white shadow-md shadow-[#0078D4]/20"
                  : "bg-[#0D1B2A] text-[#94A3B8] hover:text-white border border-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notice Type Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#94A3B8]" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-[#0D1B2A] border border-white/15 text-white text-xs focus:outline-none focus:border-[#0078D4]"
          >
            <option value="ALL">All Notice Types</option>
            <option value="QUIZ_NOTICE">Quiz Notice</option>
            <option value="EVENT_NOTICE">Event Notice</option>
            <option value="QUIZ_WINNERS_NOTICE">Quiz Winners Notice</option>
            <option value="ACTIVE_PARTICIPANTS_NOTICE">Active Participants Notice</option>
            <option value="PLACEMENT_QUESTIONS_NOTICE">Placement Questions Notice</option>
          </select>
        </div>
      </div>

      {/* Notices Table */}
      <div className="rounded-2xl bg-[#0D1B2A] border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#CBD5E1]">
            <thead className="bg-[#07111F] text-xs font-mono uppercase tracking-wider text-[#94A3B8] border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Notice Title / Event</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Responsible OB</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#94A3B8]">
                    Loading notice records...
                  </td>
                </tr>
              ) : filteredNotices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#94A3B8]">
                    No notices match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredNotices.map((n) => (
                  <tr key={n.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#F8FAFC]">{n.title}</div>
                      {n.eventName && (
                        <span className="text-[11px] text-[#22D3EE] font-mono block">
                          Event: {n.eventName}
                        </span>
                      )}
                      {n.rejectionReason && (
                        <p className="text-xs text-red-400 mt-1 italic">
                          Feedback: &quot;{n.rejectionReason}&quot;
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[#0078D4]/10 border border-[#0078D4]/20 text-[#22D3EE]">
                        {n.noticeType.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-[#CBD5E1]">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#0078D4]" />
                        <span className="font-semibold text-white">{n.obName}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-[#94A3B8]">
                      {n.createdAt}
                    </td>

                    <td className="px-6 py-4">
                      {n.status === "PUBLISHED" || n.status === "APPROVED" ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Published
                        </span>
                      ) : n.status === "PENDING_APPROVAL" ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Pending Approval
                        </span>
                      ) : n.status === "REJECTED" ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          Rejected
                        </span>
                      ) : n.status === "UNPUBLISHED" ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/20">
                          Unpublished
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/20">
                          Draft
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Preview */}
                        <button
                          onClick={() => setPreviewNotice(n)}
                          className="p-1.5 rounded-lg text-[#22D3EE] hover:bg-white/10"
                          title="Preview Stamped PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Download PDF */}
                        <a
                          href={`/api/notices/pdf?id=${n.id}&download=true`}
                          download
                          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        {/* Approve Button */}
                        {n.status === "PENDING_APPROVAL" && (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isProcessingAction}
                            onClick={() => handleReviewAction(n.id, "APPROVE")}
                            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            className="text-xs bg-emerald-600 hover:bg-emerald-500"
                          >
                            Approve &amp; Publish
                          </Button>
                        )}

                        {/* Reject Button */}
                        {n.status === "PENDING_APPROVAL" && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isProcessingAction}
                            onClick={() => {
                              setRejectingNotice(n);
                              setRejectionReason("");
                            }}
                            leftIcon={<XCircle className="w-3.5 h-3.5 text-red-400" />}
                            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            Reject
                          </Button>
                        )}

                        {/* Unpublish Button */}
                        {(n.status === "PUBLISHED" || n.status === "APPROVED") && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isProcessingAction}
                            onClick={() => handleReviewAction(n.id, "UNPUBLISH")}
                            leftIcon={<EyeOff className="w-3.5 h-3.5 text-amber-400" />}
                            className="text-xs text-amber-400 hover:bg-amber-500/10"
                          >
                            Unpublish
                          </Button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            if (confirm(`Permanently delete notice "${n.title}"?`)) {
                              handleReviewAction(n.id, "DELETE");
                            }
                          }}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REJECTION REASON MODAL */}
      {rejectingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0D1B2A] border border-red-500/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="font-bold text-base text-white">
                  Reject Notice: {rejectingNotice.title}
                </h3>
              </div>
              <button
                onClick={() => setRejectingNotice(null)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#CBD5E1]">
              Please state the specific reason or requested corrections. This feedback will be displayed in the Office Bearer&apos;s workspace so they can make corrections and resubmit.
            </p>

            <div>
              <label className="block text-xs font-mono uppercase text-[#94A3B8] mb-1.5">
                Rejection Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Please update the presenter names and correct the venue location."
                className="w-full p-3 rounded-xl bg-[#07111F] border border-white/15 text-white text-xs focus:outline-none focus:border-red-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRejectingNotice(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!rejectionReason.trim() || isProcessingAction}
                onClick={() => handleReviewAction(rejectingNotice.id, "REJECT", rejectionReason)}
                className="text-xs bg-red-600 hover:bg-red-500"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SIZE PREVIEW MODAL */}
      {previewNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-4xl h-[90vh] rounded-3xl bg-[#0D1B2A] border border-white/15 p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-[#0078D4]" />
                <div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">
                    {previewNotice.title}
                  </h3>
                  <span className="text-[11px] font-mono text-[#94A3B8]">
                    Submitted by {previewNotice.obName} • Type: {previewNotice.noticeType}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPreviewNotice(null)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-[#07111F] rounded-2xl border border-white/10 overflow-hidden relative flex items-center justify-center">
              <iframe
                src={`/api/notices/pdf?id=${previewNotice.id}`}
                title="Notice PDF Preview"
                className="w-full h-full rounded-2xl"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <a
                  href={`/api/notices/pdf?id=${previewNotice.id}&download=true`}
                  download
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0D1B2A] border border-white/15 text-white hover:border-white/30 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>
                <a
                  href={`/api/notices/pdf?id=${previewNotice.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0D1B2A] border border-white/15 text-[#22D3EE] hover:border-white/30 flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Tab</span>
                </a>
              </div>

              <div className="flex items-center gap-2">
                {previewNotice.status === "PENDING_APPROVAL" && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        handleReviewAction(previewNotice.id, "APPROVE");
                        setPreviewNotice(null);
                      }}
                      className="text-xs bg-emerald-600 hover:bg-emerald-500"
                    >
                      Approve &amp; Publish
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setRejectingNotice(previewNotice);
                        setPreviewNotice(null);
                      }}
                      className="text-xs text-red-400 hover:bg-red-500/10"
                    >
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPreviewNotice(null)}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
