"use client";

import React, { useState, useEffect } from "react";
import { History, Eye, X, CheckCircle2, Clock, XCircle, FileText } from "lucide-react";
import { useOBAuth } from "./OBAuthProvider";
import { Button } from "../ui/Button";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { EmptyState } from "../ui/EmptyState";

interface GenericSubmission {
  id: string;
  type: "General Quiz" | "Placement Questions" | "Feed Community" | "Technical Games";
  title: string;
  submittedDate: string;
  status: "Draft" | "Pending" | "Pending Approval" | "Approved" | "Rejected";
  details: string;
  extraMeta?: string;
}

export const OBSubmissions: React.FC = () => {
  const { currentOb, submissions, feedPosts } = useOBAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<GenericSubmission | null>(null);

  const fetchSubmissions = () => {
    setLoading(true);
    setError(false);

    try {
      // Simulate loading delay for realistic state
      setTimeout(() => {
        setLoading(false);
      }, 400);
    } catch (e) {
      setLoading(false);
      setError(true);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [currentOb.id]);

  if (loading) {
    return <LoadingState label="Loading submissions..." className="py-16" />;
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load submissions"
        description="We couldn't load your submission history. Please try again."
        onRetry={fetchSubmissions}
      />
    );
  }

  // Security: Query/Filter submissions strictly matching authenticated OB identity
  const obSubmissionsList: GenericSubmission[] = [];

  // 1. Quiz / Placement submissions by this OB
  submissions.forEach((sub) => {
    if (sub.submittedBy === currentOb.name) {
      obSubmissionsList.push({
        id: sub.id,
        type: sub.type,
        title: sub.title,
        submittedDate: sub.submittedDate,
        status: sub.status,
        details: `Questions: ${sub.questionsToUpload} total (${sub.questionsToDisplay} displayed) • Timer: ${sub.timerMinutes} mins • File: ${sub.csvFileName}`,
        extraMeta: sub.rejectionReason ? `Rejection Reason: ${sub.rejectionReason}` : undefined,
      });
    }
  });

  // 2. Feed Posts by this OB
  feedPosts.forEach((post) => {
    if (post.authorName === currentOb.name) {
      obSubmissionsList.push({
        id: post.id,
        type: "Feed Community",
        title: post.content.length > 60 ? post.content.substring(0, 60) + "..." : post.content,
        submittedDate: post.timestamp,
        status: post.status,
        details: post.content,
        extraMeta: `Media Type: ${post.mediaType}${post.mediaUrl ? ` • URL: ${post.mediaUrl}` : ""}`,
      });
    }
  });

  // Sort newest first
  obSubmissionsList.sort(
    (a, b) => new Date(b.submittedDate.replace(" ", "T")).getTime() - new Date(a.submittedDate.replace(" ", "T")).getTime()
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#F8FAFC] tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-[#22D3EE]" />
            My Submissions
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">
            Submission history for <span className="font-semibold text-white">{currentOb.name}</span> ({currentOb.department})
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#0078D4]/10 border border-[#0078D4]/30 text-[#22D3EE] self-start sm:self-auto">
          {obSubmissionsList.length} Total Records
        </span>
      </div>

      {/* Main Content */}
      {obSubmissionsList.length === 0 ? (
        <EmptyState
          title="No Submissions Yet"
          description="You haven't submitted any content for approval."
          icon={<FileText className="w-6 h-6 text-[#94A3B8]" />}
          className="py-12"
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-[#0D1B2A] shadow-xl">
            <table className="w-full text-left text-xs text-[#CBD5E1]">
              <thead className="bg-[#122438] text-[11px] font-mono uppercase tracking-wider text-[#94A3B8] border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Type</th>
                  <th className="py-3.5 px-4 font-semibold">Title / Description</th>
                  <th className="py-3.5 px-4 font-semibold">Submitted Date</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {obSubmissionsList.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-mono text-[11px] font-semibold text-[#0078D4] bg-[#0078D4]/10 px-2.5 py-1 rounded-md border border-[#0078D4]/20">
                        {sub.type}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-[#F8FAFC] max-w-xs truncate">
                      {sub.title}
                    </td>
                    <td className="py-4 px-4 font-mono text-[#94A3B8]">
                      {sub.submittedDate}
                    </td>
                    <td className="py-4 px-4">
                      {sub.status === "Approved" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approved
                        </span>
                      )}
                      {(sub.status === "Pending" || sub.status === "Pending Approval") && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                      {sub.status === "Rejected" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          <XCircle className="w-3.5 h-3.5" />
                          Rejected
                        </span>
                      )}
                      {sub.status === "Draft" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/20">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedSubmission(sub)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-3">
            {obSubmissionsList.map((sub) => (
              <div
                key={sub.id}
                className="p-4 rounded-xl bg-[#0D1B2A] border border-white/10 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold text-[#0078D4]">
                    {sub.type}
                  </span>
                  <div>
                    {sub.status === "Approved" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Approved
                      </span>
                    )}
                    {(sub.status === "Pending" || sub.status === "Pending Approval") && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pending
                      </span>
                    )}
                    {sub.status === "Rejected" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                        Rejected
                      </span>
                    )}
                    {sub.status === "Draft" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/20">
                        Draft
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="font-semibold text-[#F8FAFC] text-sm leading-snug">
                  {sub.title}
                </h4>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[#94A3B8] font-mono">
                  <span>{sub.submittedDate}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    onClick={() => setSelectedSubmission(sub)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Basic Details View Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#0078D4]" />
                <h3 className="text-base font-bold text-[#F8FAFC]">Submission Details</h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">
                  Submission Type
                </span>
                <span className="text-sm font-semibold text-[#22D3EE]">
                  {selectedSubmission.type}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">
                  Title / Content
                </span>
                <p className="text-sm text-[#F8FAFC] leading-relaxed font-medium bg-[#07111F] p-3 rounded-xl border border-white/10">
                  {selectedSubmission.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">
                    Submitted Date
                  </span>
                  <span className="text-xs text-[#CBD5E1] font-mono">
                    {selectedSubmission.submittedDate}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">
                    Current Status
                  </span>
                  <span className="text-xs font-semibold text-white">
                    {selectedSubmission.status}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">
                  Full Details
                </span>
                <p className="text-xs text-[#CBD5E1] leading-relaxed bg-[#07111F] p-3 rounded-xl border border-white/10 font-mono">
                  {selectedSubmission.details}
                </p>
              </div>

              {selectedSubmission.extraMeta && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                  {selectedSubmission.extraMeta}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedSubmission(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
