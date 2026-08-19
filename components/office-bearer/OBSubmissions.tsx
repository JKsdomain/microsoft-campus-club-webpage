"use client";

import React, { useState } from "react";
import { History, Eye, X, CheckCircle2, Clock, XCircle, FileText, Edit3, RefreshCw, AlertCircle, Calendar, Image as ImageIcon, Video, UploadCloud, Trash2 } from "lucide-react";
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
  status: "Draft" | "Pending" | "Pending Approval" | "Approved" | "Rejected" | "Pending Re-Approval" | "Archived";
  details: string;
  extraMeta?: string;
  startAt?: string | null;
  endAt?: string | null;
  // Original data for editing
  originalData?: any;
  revisionNumber?: number;
  parentId?: string | null;
}

export const OBSubmissions: React.FC = () => {
  const { currentOb, submissions, feedPosts, submitRevision, extendDeadline } = useOBAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<GenericSubmission | null>(null);

  // Edit revision modal state
  const [editingSubmission, setEditingSubmission] = useState<GenericSubmission | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editComment, setEditComment] = useState("");
  const [editMediaType, setEditMediaType] = useState<"none" | "image" | "video">("none");
  const [editMediaUrl, setEditMediaUrl] = useState<string>("");
  const [editMediaPublicId, setEditMediaPublicId] = useState<string>("");
  const [isUploadingEditMedia, setIsUploadingEditMedia] = useState(false);
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [revisionSuccess, setRevisionSuccess] = useState(false);

  // Extend deadline modal state
  const [extendingSubmission, setExtendingSubmission] = useState<GenericSubmission | null>(null);
  const [extEndDate, setExtEndDate] = useState("");
  const [extEndTime, setExtEndTime] = useState("");
  const [isExtending, setIsExtending] = useState(false);
  const [extSuccess, setExtSuccess] = useState(false);

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

  React.useEffect(() => {
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

  // Check if a pending revision already exists for a given parent
  const hasPendingRevision = (parentId: string): boolean => {
    const pendingQuiz = submissions.some(
      (s) => s.parentId === parentId && s.status === "Pending Re-Approval"
    );
    const pendingFeed = feedPosts.some(
      (p) => p.parentId === parentId && p.status === "Pending Re-Approval"
    );
    return pendingQuiz || pendingFeed;
  };

  const formatDisplayDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } catch {
      return dateStr;
    }
  };

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
        startAt: sub.startAt,
        endAt: sub.endAt,
        originalData: sub,
        revisionNumber: sub.revisionNumber,
        parentId: sub.parentId,
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
        originalData: post,
        revisionNumber: post.revisionNumber,
        parentId: post.parentId,
      });
    }
  });

  // Sort newest first
  obSubmissionsList.sort(
    (a, b) => new Date(b.submittedDate.replace(" ", "T")).getTime() - new Date(a.submittedDate.replace(" ", "T")).getTime()
  );

  // Handle opening the edit modal (Content revision)
  const handleOpenEdit = (sub: GenericSubmission) => {
    setEditingSubmission(sub);
    setEditTitle(sub.originalData?.title || sub.title || "");
    setEditDetails(sub.originalData?.content || sub.details || "");
    setEditComment("");
    setEditMediaType((sub.originalData?.mediaType as any) || "none");
    setEditMediaUrl(sub.originalData?.mediaUrl || "");
    setEditMediaPublicId(sub.originalData?.mediaPublicId || "");
    setRevisionSuccess(false);
  };

  // Handle uploading new media during feed revision
  const handleEditMediaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingEditMedia(true);
    try {
      const formData = new FormData();
      formData.append("media", file);

      const res = await fetch("/api/office-bearer/feed/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Unable to upload media to Cloudinary.");
      }

      const data = await res.json();
      setEditMediaType(data.type === "VIDEO" ? "video" : "image");
      setEditMediaUrl(data.url);
      setEditMediaPublicId(data.publicId || "");
    } catch (err: any) {
      alert(err.message || "Failed to upload media. Please try again.");
    } finally {
      setIsUploadingEditMedia(false);
    }
  };

  const handleRemoveEditMedia = () => {
    setEditMediaType("none");
    setEditMediaUrl("");
    setEditMediaPublicId("");
  };

  // Handle opening the deadline extension modal
  const handleOpenExtend = (sub: GenericSubmission) => {
    setExtendingSubmission(sub);
    setExtSuccess(false);
    if (sub.endAt) {
      const d = new Date(sub.endAt);
      setExtEndDate(d.toISOString().split("T")[0]);
      setExtEndTime(d.toTimeString().substring(0, 5));
    } else {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      setExtEndDate(tomorrow.toISOString().split("T")[0]);
      setExtEndTime("18:00");
    }
  };

  // Handle submitting a revision
  const handleSubmitRevision = async () => {
    if (!editingSubmission || isSubmittingRevision) return;

    setIsSubmittingRevision(true);
    try {
      const changes: Record<string, any> = {};

      if (editingSubmission.type === "Feed Community") {
        changes.details = editDetails;
        changes.title = editDetails.length > 50 ? `${editDetails.substring(0, 47)}...` : editDetails;
        changes.mediaType = editMediaType;
        changes.mediaUrl = editMediaUrl || null;
        changes.mediaPublicId = editMediaPublicId || "";
      } else {
        changes.title = editTitle;
        changes.details = editDetails;
      }

      const success = await submitRevision(
        editingSubmission.id,
        changes,
        editComment
      );

      if (success) {
        setRevisionSuccess(true);
        setTimeout(() => {
          setEditingSubmission(null);
          setRevisionSuccess(false);
        }, 2000);
      }
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  // Handle saving deadline extension
  const handleSaveDeadline = async () => {
    if (!extendingSubmission || isExtending) return;
    if (!extEndDate || !extEndTime) {
      alert("Please select both a new End Date and End Time.");
      return;
    }

    const newEnd = new Date(`${extEndDate}T${extEndTime}`);
    if (isNaN(newEnd.getTime())) {
      alert("Invalid End Date or Time.");
      return;
    }

    if (extendingSubmission.startAt) {
      const start = new Date(extendingSubmission.startAt);
      if (newEnd.getTime() <= start.getTime()) {
        alert("New End Date & Time must be strictly after the Start Date & Time.");
        return;
      }
    }

    setIsExtending(true);
    try {
      const success = await extendDeadline(
        extendingSubmission.id,
        newEnd.toISOString()
      );
      if (success) {
        setExtSuccess(true);
        setTimeout(() => {
          setExtendingSubmission(null);
          setExtSuccess(false);
        }, 2000);
      }
    } finally {
      setIsExtending(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case "Pending":
      case "Pending Approval":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case "Pending Re-Approval":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <RefreshCw className="w-3.5 h-3.5" />
            Re-Approval
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Rejected
          </span>
        );
      case "Archived":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <History className="w-3.5 h-3.5" />
            Archived
          </span>
        );
      case "Draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/20">
            Draft
          </span>
        );
      default:
        return null;
    }
  };

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
                  <th className="py-3.5 px-4 font-semibold">Timeline / Schedule</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {obSubmissionsList.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-mono text-[11px] font-semibold text-[#0078D4] bg-[#0078D4]/10 px-2.5 py-1 rounded-md border border-[#0078D4]/20">
                        {sub.type}
                      </span>
                      {(sub.revisionNumber || 0) > 0 && (
                        <span className="ml-1.5 font-mono text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                          Rev #{sub.revisionNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-medium text-[#F8FAFC] max-w-xs truncate">
                      <div>{sub.title}</div>
                      <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5">Submitted: {sub.submittedDate}</div>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs">
                      {sub.startAt || sub.endAt ? (
                        <div className="space-y-0.5 text-[11px]">
                          {sub.startAt && (
                            <div className="text-[#22D3EE]">
                              Opens: {formatDisplayDateTime(sub.startAt)}
                            </div>
                          )}
                          {sub.endAt && (
                            <div className="text-red-400">
                              Closes: {formatDisplayDateTime(sub.endAt)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#94A3B8] text-[11px]">Default schedule</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {renderStatusBadge(sub.status)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          onClick={() => setSelectedSubmission(sub)}
                        >
                          View
                        </Button>
                        {sub.status === "Approved" && (sub.type === "General Quiz" || sub.type === "Placement Questions") && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Clock className="w-3.5 h-3.5" />}
                            className="text-[#22D3EE] hover:bg-[#22D3EE]/10 hover:border-[#22D3EE]/30"
                            onClick={() => handleOpenExtend(sub)}
                          >
                            Extend
                          </Button>
                        )}
                        {sub.status === "Approved" && !hasPendingRevision(sub.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                            className="text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30"
                            onClick={() => handleOpenEdit(sub)}
                          >
                            Edit
                          </Button>
                        )}
                        {sub.status === "Approved" && hasPendingRevision(sub.id) && (
                          <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20">
                            Revision Pending
                          </span>
                        )}
                      </div>
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
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-[#0078D4]">
                      {sub.type}
                    </span>
                    {(sub.revisionNumber || 0) > 0 && (
                      <span className="font-mono text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                        Rev #{sub.revisionNumber}
                      </span>
                    )}
                  </div>
                  {renderStatusBadge(sub.status)}
                </div>

                <h4 className="font-semibold text-[#F8FAFC] text-sm leading-snug">
                  {sub.title}
                </h4>

                {(sub.startAt || sub.endAt) && (
                  <div className="p-2 rounded-lg bg-[#07111F] border border-white/5 space-y-0.5 text-[11px] font-mono">
                    {sub.startAt && <div className="text-[#22D3EE]">Opens: {formatDisplayDateTime(sub.startAt)}</div>}
                    {sub.endAt && <div className="text-red-400">Closes: {formatDisplayDateTime(sub.endAt)}</div>}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[#94A3B8] font-mono">
                  <span>{sub.submittedDate}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedSubmission(sub)}
                    >
                      View
                    </Button>
                    {sub.status === "Approved" && (sub.type === "General Quiz" || sub.type === "Placement Questions") && (
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Clock className="w-3.5 h-3.5" />}
                        className="text-[#22D3EE] hover:bg-[#22D3EE]/10 hover:border-[#22D3EE]/30"
                        onClick={() => handleOpenExtend(sub)}
                      >
                        Extend
                      </Button>
                    )}
                    {sub.status === "Approved" && !hasPendingRevision(sub.id) && (
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                        className="text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30"
                        onClick={() => handleOpenEdit(sub)}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Basic Details View Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
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
                  {(selectedSubmission.revisionNumber || 0) > 0 && (
                    <span className="ml-2 text-purple-400 text-xs">(Revision #{selectedSubmission.revisionNumber})</span>
                  )}
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

              {/* Timeline Info in Details Modal */}
              {(selectedSubmission.startAt || selectedSubmission.endAt) && (
                <div className="p-3 rounded-xl bg-[#07111F] border border-white/10 space-y-1.5 text-xs font-mono">
                  <span className="text-[10px] uppercase text-[#94A3B8] block font-sans">
                    Configured Timeline
                  </span>
                  {selectedSubmission.startAt && (
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Starts At:</span>
                      <span className="text-[#22D3EE] font-semibold">{formatDisplayDateTime(selectedSubmission.startAt)}</span>
                    </div>
                  )}
                  {selectedSubmission.endAt && (
                    <div className="flex justify-between">
                      <span className="text-[#94A3B8]">Ends At:</span>
                      <span className="text-red-400 font-semibold">{formatDisplayDateTime(selectedSubmission.endAt)}</span>
                    </div>
                  )}
                </div>
              )}

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

            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {selectedSubmission.status === "Approved" && (selectedSubmission.type === "General Quiz" || selectedSubmission.type === "Placement Questions") && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Clock className="w-3.5 h-3.5" />}
                    className="text-[#22D3EE] hover:bg-[#22D3EE]/10 hover:border-[#22D3EE]/30"
                    onClick={() => {
                      const target = selectedSubmission;
                      setSelectedSubmission(null);
                      handleOpenExtend(target);
                    }}
                  >
                    Extend Deadline
                  </Button>
                )}
                {selectedSubmission.status === "Approved" && !hasPendingRevision(selectedSubmission.id) && (
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    className="text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/30"
                    onClick={() => {
                      const target = selectedSubmission;
                      setSelectedSubmission(null);
                      handleOpenEdit(target);
                    }}
                  >
                    Edit Content
                  </Button>
                )}
              </div>
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

      {/* Edit Revision Modal (Content edits requiring Admin re-approval) */}
      {editingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-[#F8FAFC]">Edit Published Content</h3>
              </div>
              <button
                onClick={() => setEditingSubmission(null)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
                disabled={isSubmittingRevision}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {revisionSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-[#F8FAFC]">Revision Submitted!</h4>
                <p className="text-xs text-[#CBD5E1]">
                  Your content change has been submitted for Admin re-approval. The currently published version remains active until approval.
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Content changes create a <strong>revision</strong> submitted for Admin re-approval. The currently published version will <strong>not</strong> be modified until Admin approves this change.
                  </span>
                </div>

                <div className="space-y-4">
                  {editingSubmission.type !== "Feed Community" && (
                    <div>
                      <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                      {editingSubmission.type === "Feed Community" ? "Post Content" : "Details / Description"}
                    </label>
                    <textarea
                      rows={5}
                      value={editDetails}
                      onChange={(e) => setEditDetails(e.target.value)}
                      className="w-full p-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4] leading-relaxed"
                    />
                  </div>

                  {editingSubmission.type === "Feed Community" && (
                    <div className="p-3.5 rounded-xl bg-[#07111F] border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#CBD5E1] flex items-center space-x-2">
                          <UploadCloud className="w-4 h-4 text-[#22D3EE]" />
                          <span>Attached Image / Video</span>
                        </span>
                        <span className="text-[10px] font-mono text-[#94A3B8]">
                          CLOUDINARY STORAGE
                        </span>
                      </div>

                      {editMediaType !== "none" && editMediaUrl ? (
                        <div className="relative rounded-xl overflow-hidden border border-white/10 max-h-56 bg-black">
                          <button
                            type="button"
                            onClick={handleRemoveEditMedia}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/75 text-white hover:bg-red-500 transition-colors z-10"
                            title="Remove Media"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {editMediaType === "video" ? (
                            <video src={editMediaUrl} controls className="w-full h-48 object-cover" />
                          ) : (
                            <img src={editMediaUrl} alt="Revision media preview" className="w-full h-48 object-cover" />
                          )}
                        </div>
                      ) : (
                        <label className="cursor-pointer flex items-center justify-center space-x-2 p-3 rounded-xl border border-dashed border-white/20 hover:border-[#0078D4] bg-white/[0.02] text-xs text-[#CBD5E1] transition-colors">
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleEditMediaFileChange}
                            disabled={isUploadingEditMedia}
                            className="hidden"
                          />
                          {isUploadingEditMedia ? (
                            <span className="animate-pulse text-[#22D3EE]">
                              Uploading to Cloudinary...
                            </span>
                          ) : (
                            <>
                              <ImageIcon className="w-4 h-4 text-[#0078D4]" />
                              <span>Upload New Image or Video (Cloudinary)</span>
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                      Revision Comment <span className="text-[#94A3B8]">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      placeholder="e.g. Updated image with new event banner"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-3">
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setEditingSubmission(null)}
                    disabled={isSubmittingRevision}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    className="bg-purple-600 hover:bg-purple-700"
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    onClick={handleSubmitRevision}
                    disabled={isSubmittingRevision}
                  >
                    {isSubmittingRevision ? "Submitting..." : "Submit for Re-Approval"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Extend Deadline Modal (Timeline adjustment without requiring Admin re-approval) */}
      {extendingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-[#22D3EE]" />
                <h3 className="text-base font-bold text-[#F8FAFC]">Extend Activity Deadline</h3>
              </div>
              <button
                onClick={() => setExtendingSubmission(null)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
                disabled={isExtending}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {extSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#F8FAFC]">Deadline Extended!</h4>
                <p className="text-xs text-[#CBD5E1]">
                  The new deadline has been persisted to MongoDB. Students Corner reflects this change immediately without requiring Admin re-approval.
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-[#0078D4]/10 border border-[#0078D4]/20 text-[#22D3EE] text-xs leading-relaxed">
                  <strong>Timeline-Only Update:</strong> Modifying the deadline does <strong>not</strong> create a new revision and does <strong>not</strong> require Admin approval.
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Activity</span>
                    <span className="font-semibold text-white">{extendingSubmission.title}</span>
                  </div>

                  {extendingSubmission.startAt && (
                    <div>
                      <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Starting Time</span>
                      <span className="font-mono text-[#CBD5E1]">{formatDisplayDateTime(extendingSubmission.startAt)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <label className="block text-xs font-semibold text-[#F8FAFC]">
                      New Ending Date & Time
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono text-[#94A3B8] mb-1">Date</label>
                        <input
                          type="date"
                          value={extEndDate}
                          onChange={(e) => setExtEndDate(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg bg-[#07111F] border border-white/15 text-[#F8FAFC] text-xs focus:outline-none focus:border-[#0078D4]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#94A3B8] mb-1">Time</label>
                        <input
                          type="time"
                          value={extEndTime}
                          onChange={(e) => setExtEndTime(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg bg-[#07111F] border border-white/15 text-[#F8FAFC] text-xs focus:outline-none focus:border-[#0078D4]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExtendingSubmission(null)}
                    disabled={isExtending}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveDeadline}
                    disabled={isExtending}
                  >
                    {isExtending ? "Updating..." : "Update Deadline"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
