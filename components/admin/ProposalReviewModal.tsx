"use client";

import React, { useState } from "react";
import { X, CheckCircle2, XCircle, Eye, FileText, Image as ImageIcon, HelpCircle, RefreshCw } from "lucide-react";
import { Proposal } from "@/lib/adminState";
import { ACTIVE_PLACEMENT_SET, ACTIVE_QUIZ_SET } from "@/lib/studentState";
import { Button } from "../ui/Button";

interface ProposalReviewModalProps {
  isOpen: boolean;
  proposal: Proposal | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const ProposalReviewModal: React.FC<ProposalReviewModalProps> = ({
  isOpen,
  proposal,
  onClose,
  onApprove,
  onReject,
}) => {
  const [confirmMode, setConfirmMode] = useState<"approve" | "reject" | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  if (!isOpen || !proposal) return null;

  const isRevision = proposal.isRevision || (proposal.revisionNumber || 0) > 0;
  const isPendingReview = proposal.status === "Pending" || proposal.status === "Pending Re-Approval";

  const handleAction = () => {
    if (confirmMode === "approve") {
      onApprove(proposal.id);
    } else if (confirmMode === "reject") {
      onReject(proposal.id);
    }
    setConfirmMode(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-16 sm:pt-20 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#0078D4] block">
                {proposal.type} {isRevision ? "Revision" : "Proposal"} Review
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Admin Inspection
              </span>
              {isRevision && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <RefreshCw className="w-3 h-3" />
                  Revision #{proposal.revisionNumber}
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-[#F8FAFC] mt-1">
              {proposal.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation State overlay vs Content View */}
        {confirmMode ? (
          <div className="py-8 text-center space-y-4">
            {confirmMode === "approve" ? (
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                <XCircle className="w-7 h-7" />
              </div>
            )}

            <h4 className="text-xl font-bold text-[#F8FAFC]">
              {confirmMode === "approve"
                ? isRevision ? "Approve & publish this revision?" : "Approve & Publish this proposal?"
                : isRevision ? "Reject this revision?" : "Reject this proposal?"}
            </h4>

            <p className="text-xs text-[#CBD5E1] max-w-sm mx-auto leading-relaxed">
              {confirmMode === "approve" && isRevision
                ? `This will replace the currently published version with revision #${proposal.revisionNumber}. The old version will be archived.`
                : confirmMode === "reject" && isRevision
                ? "The currently published version will remain active. This revision will be rejected."
                : `This action will update the platform publication status for "${proposal.title}".`}
            </p>

            <div className="flex items-center justify-center space-x-3 pt-4">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setConfirmMode(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className={
                  confirmMode === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }
                onClick={handleAction}
              >
                {confirmMode === "approve"
                  ? isRevision ? "Confirm Revision Approval" : "Confirm Approval"
                  : isRevision ? "Confirm Revision Rejection" : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Revision Info Banner */}
            {isRevision && (
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs flex items-start gap-2">
                <RefreshCw className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>This is a revision</strong> (#{proposal.revisionNumber}) of an already-published activity.
                  {proposal.revisionComment && (
                    <span className="block mt-1 text-purple-200">
                      Revision comment: &quot;{proposal.revisionComment}&quot;
                    </span>
                  )}
                  <span className="block mt-1 text-[#94A3B8]">
                    Approving will replace the currently published version. Rejecting will keep the current version active.
                  </span>
                </div>
              </div>
            )}

            {/* Metadata Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#07111F] border border-white/10 text-xs">
              <div>
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Submitted By</span>
                <span className="font-semibold text-[#F8FAFC]">{proposal.submittedBy}</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Submitted Date</span>
                <span className="font-mono text-[#CBD5E1]">{proposal.submittedDate}</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Current Status</span>
                <span className={`font-semibold ${
                  proposal.status === "Pending Re-Approval" ? "text-purple-400" : "text-amber-400"
                }`}>
                  {proposal.status}
                </span>
              </div>

              {(proposal.startAt || proposal.endAt) && (
                <div className="col-span-2 sm:col-span-3 pt-2 mt-1 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono">
                  <div>
                    <span className="text-[#94A3B8]">Start Schedule: </span>
                    <span className="text-[#22D3EE] font-semibold">
                      {proposal.startAt ? new Date(proposal.startAt).toLocaleString() : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8]">End Schedule: </span>
                    <span className="text-red-400 font-semibold">
                      {proposal.endAt ? new Date(proposal.endAt).toLocaleString() : "—"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Student Preview Box */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#22D3EE] flex items-center space-x-1.5">
                  <Eye className="w-4 h-4" />
                  <span>{isRevision ? "Proposed Updated Version" : "Student View Preview"}</span>
                </span>
                <span className="text-[11px] text-[#94A3B8] font-mono">Read-Only Admin Inspection</span>
              </div>

              <div className="p-5 rounded-xl bg-[#07111F] border border-white/10 space-y-4">
                {proposal.type === "General Quiz" && (() => {
                  const quizQuestions = (proposal.questions && proposal.questions.length > 0)
                    ? proposal.questions
                    : ACTIVE_QUIZ_SET.questions;
                  return (
                    <div className="space-y-4 text-xs">
                      <div className="p-3 rounded-lg bg-[#0D1B2A] border border-white/10 space-y-1">
                        <h5 className="font-bold text-[#F8FAFC] text-sm">{proposal.title}</h5>
                        <p className="text-[#94A3B8]">
                          Configuration: {quizQuestions.length} Questions • {proposal.timerMinutes || 15} Minutes • Randomization: Enabled
                        </p>
                      </div>

                      <div className="space-y-3">
                        {quizQuestions.map((q: any, idx: number) => (
                          <div key={q.id || idx} className="p-3 rounded-lg bg-[#0D1B2A]/60 border border-white/5 space-y-2">
                            <span className="font-bold text-[#22D3EE]">Q{idx + 1}. {q.question}</span>
                            <div className="pl-2 space-y-1 text-[#CBD5E1]">
                              {(q.options || []).map((opt: string, oIdx: number) => (
                                <div key={oIdx} className={opt === q.correctAnswer ? "text-emerald-400 font-semibold" : ""}>
                                  {String.fromCharCode(65 + oIdx)}. {opt} {opt === q.correctAnswer && "✓ (Correct Answer)"}
                                </div>
                              ))}
                            </div>
                            {q.explanation && (
                              <p className="text-[#94A3B8] pt-1 text-[11px]">
                                <strong>Explanation:</strong> {q.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {proposal.type === "Placement Questions" && (() => {
                  const placementQuestions = (proposal.questions && proposal.questions.length > 0)
                    ? proposal.questions
                    : ACTIVE_PLACEMENT_SET.questions;
                  return (
                    <div className="space-y-4 text-xs">
                      <div className="p-3 rounded-lg bg-[#0D1B2A] border border-white/10 space-y-1">
                        <h5 className="font-bold text-[#F8FAFC] text-sm">{proposal.title}</h5>
                        <p className="text-[#94A3B8]">
                          Configuration: {placementQuestions.length} Questions • {proposal.timerMinutes || 30} Minutes • Secure Test Environment Required
                        </p>
                      </div>

                      <div className="space-y-3">
                        {placementQuestions.map((q: any, idx: number) => (
                          <div key={q.id || idx} className="p-3 rounded-lg bg-[#0D1B2A]/60 border border-white/5 space-y-2">
                            <span className="font-bold text-[#22D3EE]">Q{idx + 1}. {q.question}</span>
                            <div className="pl-2 space-y-1 text-[#CBD5E1]">
                              {(q.options || []).map((opt: string, oIdx: number) => (
                                <div key={oIdx} className={opt === q.correctAnswer ? "text-emerald-400 font-semibold" : ""}>
                                  {String.fromCharCode(65 + oIdx)}. {opt} {opt === q.correctAnswer && "✓ (Correct Answer)"}
                                </div>
                              ))}
                            </div>
                            {q.explanation && (
                              <p className="text-[#94A3B8] pt-1 text-[11px]">
                                <strong>Explanation:</strong> {q.explanation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {proposal.type === "Feed Community" && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center space-x-2 pb-2 border-b border-white/10">
                      <span className="font-bold text-[#F8FAFC]">{proposal.submittedBy}</span>
                      {proposal.authorDepartment && (
                        <span className="text-[#94A3B8]">({proposal.authorDepartment})</span>
                      )}
                      <span className="text-[#94A3B8]">• {proposal.submittedDate}</span>
                    </div>
                    <p className="text-[#CBD5E1] leading-relaxed whitespace-pre-line text-sm">
                      {proposal.details}
                    </p>
                    {proposal.mediaUrl && (
                      <div className="rounded-xl overflow-hidden border border-white/10 max-h-60 bg-black mt-3">
                        {proposal.mediaType === "video" ? (
                          <video src={proposal.mediaUrl} controls className="w-full max-h-56 object-cover" />
                        ) : (
                          <img src={proposal.mediaUrl} alt="Feed media" className="w-full max-h-56 object-cover" />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {proposal.type === "Technical Games" && (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-lg bg-[#0D1B2A] border border-white/10 space-y-1">
                      <h5 className="font-bold text-[#F8FAFC] text-sm">{proposal.title}</h5>
                      <p className="text-[#94A3B8]">Technical Game Challenge Proposal</p>
                    </div>
                    <p className="text-[#CBD5E1] leading-relaxed whitespace-pre-line text-sm">
                      {proposal.details}
                    </p>
                  </div>
                )}

                {proposal.type !== "General Quiz" && proposal.type !== "Placement Questions" && proposal.type !== "Feed Community" && proposal.type !== "Technical Games" && (
                  <div className="text-xs text-[#CBD5E1] leading-relaxed">
                    {proposal.details}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isPendingReview && (
              <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  size="md"
                  className="text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
                  onClick={() => setConfirmMode("reject")}
                >
                  {isRevision ? "Reject Revision" : "Reject Proposal"}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setConfirmMode("approve")}
                >
                  {isRevision ? "Approve Revision" : "Approve Proposal"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
