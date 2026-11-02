"use client";

import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Save,
  Send,
  Eye,
  Download,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Clock,
  RefreshCw,
  ExternalLink,
  X,
  Users,
  Trophy,
  Calendar,
  Briefcase,
  HelpCircle,
} from "lucide-react";
import { useOBAuth } from "@/components/office-bearer/OBAuthProvider";
import { Button } from "@/components/ui/Button";

interface WinnerRow {
  name: string;
  year: string;
  department: string;
}

interface ParticipantRow {
  name: string;
  year: string;
  department: string;
}

interface NoticeRecord {
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

export default function OBNoticesPage() {
  const { currentOb, isHydrated } = useOBAuth();

  // Determine Notice Type from assigned responsibility
  const respName = currentOb.assignedResponsibility || "Unassigned";
  const assignedEvent = currentOb.assignedEvent;

  const isQuizNotice = respName === "Quiz Notice";
  const isEventNotice = respName === "Event Notice";
  const isQuizWinnersNotice = respName === "Quiz Winners Notice";
  const isActiveParticipantsNotice = respName === "Active Participants Notice";
  const isPlacementNotice = respName === "Placement Questions Notice";

  const isNoticeLead =
    isQuizNotice || isEventNotice || isQuizWinnersNotice || isActiveParticipantsNotice || isPlacementNotice;

  const noticeType = isQuizNotice
    ? "QUIZ_NOTICE"
    : isEventNotice
    ? "EVENT_NOTICE"
    : isQuizWinnersNotice
    ? "QUIZ_WINNERS_NOTICE"
    : isActiveParticipantsNotice
    ? "ACTIVE_PARTICIPANTS_NOTICE"
    : isPlacementNotice
    ? "PLACEMENT_QUESTIONS_NOTICE"
    : "";

  // Common Form States
  const [noticeTitle, setNoticeTitle] = useState("");
  const [activeNoticeId, setActiveNoticeId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>("DRAFT");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  // 1. Quiz Notice fields
  const [quizName, setQuizName] = useState("");
  const [quizLink, setQuizLink] = useState("https://microsoft-campus-club-webpage.vercel.app/students-corner");
  const [quizExtra, setQuizExtra] = useState("");

  // 2. Event Notice fields
  const [eventName, setEventName] = useState(assignedEvent?.name || "");
  const [presenters, setPresenters] = useState("");
  const [eventVenue, setEventVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventExtra, setEventExtra] = useState("");

  // 3. Quiz Winners Notice fields
  const [winnersQuizName, setWinnersQuizName] = useState("");
  const [winners, setWinners] = useState<WinnerRow[]>([
    { name: "", year: "III", department: "Computer Science & Engineering" },
  ]);

  // 4. Active Participants Notice fields
  const [activityName, setActivityName] = useState("");
  const [participants, setParticipants] = useState<ParticipantRow[]>([
    { name: "", year: "III", department: "Computer Science & Engineering" },
  ]);
  const [activeExtra, setActiveExtra] = useState("");

  // 5. Placement Notice fields
  const [placementTitle, setPlacementTitle] = useState("");
  const [placementLink, setPlacementLink] = useState("https://microsoft-campus-club-webpage.vercel.app/students-corner");
  const [placementExtra, setPlacementExtra] = useState("");

  // Notices List & UI State
  const [myNotices, setMyNotices] = useState<NoticeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Preview Modal
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Sync event name if assignedEvent changes
  useEffect(() => {
    if (assignedEvent?.name) {
      setEventName(assignedEvent.name);
    }
  }, [assignedEvent]);

  // Load existing notices for this OB
  const loadNotices = async () => {
    if (!isNoticeLead) return;
    try {
      setIsLoading(true);
      const res = await fetch("/api/notices");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.notices)) {
          setMyNotices(data.notices);
        }
      }
    } catch (e) {
      console.error("Failed to load notices:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isHydrated && isNoticeLead) {
      loadNotices();
    }
  }, [isHydrated, isNoticeLead]);

  // Build contentData payload based on active noticeType
  const buildContentData = () => {
    switch (noticeType) {
      case "QUIZ_NOTICE":
        return {
          quizName: quizName.trim(),
          quizLink: quizLink.trim(),
          additionalContent: quizExtra.trim(),
        };
      case "EVENT_NOTICE":
        return {
          eventName: (assignedEvent?.name || eventName).trim(),
          presenters: presenters
            .split(/[,;\n]+/)
            .map((s) => s.trim())
            .filter(Boolean),
          venue: eventVenue.trim(),
          date: eventDate.trim(),
          time: eventTime.trim(),
          additionalContent: eventExtra.trim(),
        };
      case "QUIZ_WINNERS_NOTICE":
        return {
          quizName: winnersQuizName.trim(),
          winners: winners.filter((w) => w.name.trim() !== ""),
        };
      case "ACTIVE_PARTICIPANTS_NOTICE":
        return {
          activityName: activityName.trim(),
          participants: participants.filter((p) => p.name.trim() !== ""),
          additionalContent: activeExtra.trim(),
        };
      case "PLACEMENT_QUESTIONS_NOTICE":
        return {
          activityName: placementTitle.trim(),
          link: placementLink.trim(),
          additionalContent: placementExtra.trim(),
        };
      default:
        return {};
    }
  };

  // Populate form with existing notice data
  const handleEditNotice = (n: NoticeRecord) => {
    setActiveNoticeId(n.id);
    setNoticeTitle(n.title);
    setCurrentStatus(n.status);
    setRejectionReason(n.rejectionReason || null);

    const cd = n.contentData || {};
    if (n.noticeType === "QUIZ_NOTICE") {
      setQuizName(cd.quizName || "");
      setQuizLink(cd.quizLink || "");
      setQuizExtra(cd.additionalContent || "");
    } else if (n.noticeType === "EVENT_NOTICE") {
      setEventName(cd.eventName || assignedEvent?.name || "");
      setPresenters(Array.isArray(cd.presenters) ? cd.presenters.join(", ") : cd.presenters || "");
      setEventVenue(cd.venue || "");
      setEventDate(cd.date || "");
      setEventTime(cd.time || "");
      setEventExtra(cd.additionalContent || "");
    } else if (n.noticeType === "QUIZ_WINNERS_NOTICE") {
      setWinnersQuizName(cd.quizName || "");
      setWinners(
        Array.isArray(cd.winners) && cd.winners.length > 0
          ? cd.winners
          : [{ name: "", year: "III", department: "Computer Science & Engineering" }]
      );
    } else if (n.noticeType === "ACTIVE_PARTICIPANTS_NOTICE") {
      setActivityName(cd.activityName || "");
      setParticipants(
        Array.isArray(cd.participants) && cd.participants.length > 0
          ? cd.participants
          : [{ name: "", year: "III", department: "Computer Science & Engineering" }]
      );
      setActiveExtra(cd.additionalContent || "");
    } else if (n.noticeType === "PLACEMENT_QUESTIONS_NOTICE") {
      setPlacementTitle(cd.activityName || "");
      setPlacementLink(cd.link || "");
      setPlacementExtra(cd.additionalContent || "");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetForm = () => {
    setActiveNoticeId(null);
    setNoticeTitle("");
    setCurrentStatus("DRAFT");
    setRejectionReason(null);
    setQuizName("");
    setQuizExtra("");
    if (!assignedEvent) setEventName("");
    setPresenters("");
    setEventVenue("");
    setEventDate("");
    setEventTime("");
    setEventExtra("");
    setWinnersQuizName("");
    setWinners([{ name: "", year: "III", department: "Computer Science & Engineering" }]);
    setActivityName("");
    setParticipants([{ name: "", year: "III", department: "Computer Science & Engineering" }]);
    setActiveExtra("");
    setPlacementTitle("");
    setPlacementExtra("");
  };

  // Validation
  const validateForm = () => {
    const title = noticeTitle.trim() || getDefaultTitle();
    if (!title) {
      setNotification({ text: "Notice title is required.", type: "error" });
      return false;
    }

    if (noticeType === "QUIZ_NOTICE") {
      if (!quizName.trim()) {
        setNotification({ text: "Quiz Name is required.", type: "error" });
        return false;
      }
      if (!quizLink.trim() || !quizLink.startsWith("http")) {
        setNotification({ text: "A valid Quiz Link (starting with http/https) is required.", type: "error" });
        return false;
      }
    } else if (noticeType === "EVENT_NOTICE") {
      const eName = assignedEvent?.name || eventName.trim();
      if (!eName) {
        setNotification({ text: "Event Name is required.", type: "error" });
        return false;
      }
      if (!presenters.trim()) {
        setNotification({ text: "Presenters are required.", type: "error" });
        return false;
      }
      if (!eventVenue.trim() || !eventDate.trim() || !eventTime.trim()) {
        setNotification({ text: "Event Venue, Date, and Time are mandatory.", type: "error" });
        return false;
      }
    } else if (noticeType === "QUIZ_WINNERS_NOTICE") {
      if (!winnersQuizName.trim()) {
        setNotification({ text: "Quiz Name is required.", type: "error" });
        return false;
      }
      const validWinners = winners.filter((w) => w.name.trim() !== "");
      if (validWinners.length === 0) {
        setNotification({ text: "Please add at least one winner name.", type: "error" });
        return false;
      }
    } else if (noticeType === "ACTIVE_PARTICIPANTS_NOTICE") {
      if (!activityName.trim()) {
        setNotification({ text: "Activity/Event Name is required.", type: "error" });
        return false;
      }
      const validParticipants = participants.filter((p) => p.name.trim() !== "");
      if (validParticipants.length === 0) {
        setNotification({ text: "Please add at least one active participant.", type: "error" });
        return false;
      }
    } else if (noticeType === "PLACEMENT_QUESTIONS_NOTICE") {
      if (!placementTitle.trim()) {
        setNotification({ text: "Placement Activity Name is required.", type: "error" });
        return false;
      }
      if (!placementLink.trim() || !placementLink.startsWith("http")) {
        setNotification({ text: "A valid Link (starting with http/https) is required.", type: "error" });
        return false;
      }
    }

    return true;
  };

  const getDefaultTitle = () => {
    switch (noticeType) {
      case "QUIZ_NOTICE":
        return quizName ? `Quiz Notice: ${quizName}` : "Official Quiz Notice";
      case "EVENT_NOTICE":
        return `Event Notice: ${assignedEvent?.name || eventName || "Offline Event"}`;
      case "QUIZ_WINNERS_NOTICE":
        return winnersQuizName ? `Quiz Winners: ${winnersQuizName}` : "Official Quiz Winners Announcement";
      case "ACTIVE_PARTICIPANTS_NOTICE":
        return activityName ? `Active Participants: ${activityName}` : "Active Participants Notice";
      case "PLACEMENT_QUESTIONS_NOTICE":
        return placementTitle ? `Placement Prep: ${placementTitle}` : "Placement Questions Announcement";
      default:
        return "Official Notice";
    }
  };

  // Save Draft or Submit for Approval
  const handleSaveNotice = async (statusToSet: "DRAFT" | "PENDING_APPROVAL") => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const title = noticeTitle.trim() || getDefaultTitle();
      const contentData = buildContentData();

      const payload = {
        id: activeNoticeId || undefined,
        title,
        noticeType,
        eventId: assignedEvent?.id || undefined,
        eventName: assignedEvent?.name || eventName || undefined,
        contentData,
        status: statusToSet,
      };

      const endpoint = "/api/notices";
      const method = activeNoticeId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        setNotification({
          text:
            statusToSet === "PENDING_APPROVAL"
              ? "Notice submitted for Admin approval! It will be published once approved."
              : "Notice saved as draft successfully.",
          type: "success",
        });
        setTimeout(() => setNotification(null), 5000);
        await loadNotices();
        if (statusToSet === "PENDING_APPROVAL") {
          handleResetForm();
        } else if (result.notice?.id) {
          setActiveNoticeId(result.notice.id);
          setCurrentStatus("DRAFT");
        }
      } else {
        const err = await res.json().catch(() => ({}));
        setNotification({ text: err.message || "Failed to save notice.", type: "error" });
      }
    } catch (e: any) {
      setNotification({ text: e.message || "Network error occurred.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live PDF Preview
  const handleOpenPreview = async () => {
    if (!validateForm()) return;

    try {
      setIsPreviewLoading(true);
      setIsPreviewOpen(true);

      const contentData = buildContentData();
      const res = await fetch("/api/notices/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noticeType, contentData }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPreviewPdfUrl(url);
      } else {
        alert("Failed to generate preview PDF.");
        setIsPreviewOpen(false);
      }
    } catch (e) {
      console.error("Preview error:", e);
      alert("Error generating preview.");
      setIsPreviewOpen(false);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Trigger direct PDF download for current form
  const handleDownloadCurrentPdf = async () => {
    if (!validateForm()) return;

    try {
      const contentData = buildContentData();
      const res = await fetch("/api/notices/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noticeType, contentData }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(noticeTitle || getDefaultTitle()).replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error("Download error:", e);
      alert("Error downloading PDF.");
    }
  };

  // Manage Winner rows
  const handleAddWinner = () => {
    setWinners((prev) => [...prev, { name: "", year: "III", department: "Computer Science & Engineering" }]);
  };
  const handleRemoveWinner = (idx: number) => {
    setWinners((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleWinnerChange = (idx: number, field: keyof WinnerRow, val: string) => {
    setWinners((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  // Manage Participant rows
  const handleAddParticipant = () => {
    setParticipants((prev) => [...prev, { name: "", year: "III", department: "Computer Science & Engineering" }]);
  };
  const handleRemoveParticipant = (idx: number) => {
    setParticipants((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleParticipantChange = (idx: number, field: keyof ParticipantRow, val: string) => {
    setParticipants((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  if (!isHydrated) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-sm text-[#94A3B8]">
        <span className="w-5 h-5 border-2 border-[#0078D4] border-t-transparent rounded-full animate-spin mr-3" />
        Loading Notice Management...
      </div>
    );
  }

  // Access Guard
  if (!isNoticeLead) {
    return (
      <div className="p-8 rounded-2xl bg-[#0D1B2A] border border-amber-500/30 text-center space-y-4 max-w-2xl mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
        <h3 className="text-xl font-bold text-[#F8FAFC]">Notice Management Restricted</h3>
        <p className="text-sm text-[#CBD5E1] leading-relaxed">
          Your current assigned responsibility is{" "}
          <span className="font-semibold text-white px-2 py-0.5 rounded bg-white/10">
            {respName}
          </span>
          .
        </p>
        <p className="text-xs text-[#94A3B8]">
          Only designated Notice Leads (Quiz Notice, Event Notice, Quiz Winners Notice, Active Participants Notice, or Placement Questions Notice) can access this workspace. Please use your assigned portal section.
        </p>
      </div>
    );
  }

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

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-3 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#0078D4]/10 to-transparent pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0078D4]/10 border border-[#0078D4]/30 text-xs font-semibold text-[#0078D4] uppercase tracking-wider">
          <Megaphone className="w-3.5 h-3.5" />
          <span>OFFICE BEARER NOTICE WORKSPACE</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
              {respName}
            </h1>
            <p className="text-sm text-[#CBD5E1] mt-1">
              {assignedEvent
                ? `Authorized specifically for event: "${assignedEvent.name}"`
                : "Generate official notices using predefined templates, preview before submission, and submit for Admin approval."}
            </p>
          </div>
          <div className="text-xs font-mono text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20 self-start sm:self-auto">
            OB LEAD: {currentOb.name}
          </div>
        </div>
      </div>

      {/* Rejection Feedback Alert (if active notice was rejected) */}
      {rejectionReason && (
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-2">
          <div className="flex items-center space-x-2 text-red-400 font-semibold text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Admin Rejection Reason — Action Required</span>
          </div>
          <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed pl-6">
            &quot;{rejectionReason}&quot;
          </p>
          <p className="text-[11px] text-[#94A3B8] pl-6 pt-1">
            Please make the requested adjustments below and click &quot;Resubmit for Approval&quot;.
          </p>
        </div>
      )}

      {/* NOTICE GENERATION FORM */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1B2A] border border-white/10 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-[#22D3EE]" />
            <h2 className="text-lg font-bold text-[#F8FAFC]">
              {activeNoticeId ? `Editing Notice (${currentStatus})` : "Create New Official Notice"}
            </h2>
          </div>
          {activeNoticeId && (
            <button
              onClick={handleResetForm}
              className="text-xs text-[#94A3B8] hover:text-white flex items-center gap-1 font-mono"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Create New Instead</span>
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Notice Title */}
          <div>
            <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Notice Title (Internal / Reference)
            </label>
            <input
              type="text"
              value={noticeTitle}
              onChange={(e) => setNoticeTitle(e.target.value)}
              placeholder={getDefaultTitle()}
              className="w-full h-11 px-4 rounded-xl bg-[#07111F] border border-white/15 text-white text-sm focus:outline-none focus:border-[#0078D4]"
            />
          </div>

          {/* DYNAMIC FORM VARIANT: 1. QUIZ NOTICE */}
          {isQuizNotice && (
            <div className="space-y-5 p-5 rounded-2xl bg-[#07111F]/60 border border-white/5">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#22D3EE]">
                <HelpCircle className="w-4 h-4" />
                <span>Quiz Notice Template Parameters</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Quiz Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={quizName}
                  onChange={(e) => setQuizName(e.target.value)}
                  placeholder="e.g. Python & Algorithms Weekly Challenge"
                  className="w-full h-11 px-4 rounded-xl bg-[#07111F] border border-white/15 text-white text-sm focus:outline-none focus:border-[#0078D4]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Quiz URL / Link <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={quizLink}
                  onChange={(e) => setQuizLink(e.target.value)}
                  placeholder="https://microsoft-campus-club-webpage.vercel.app/students-corner"
                  className="w-full h-11 px-4 rounded-xl bg-[#07111F] border border-white/15 text-white text-sm focus:outline-none focus:border-[#0078D4]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Additional Content / Instructions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={quizExtra}
                  onChange={(e) => setQuizExtra(e.target.value)}
                  placeholder="e.g. Think fast! Top 3 scorers win exclusive digital achievement badges."
                  className="w-full p-4 rounded-xl bg-[#07111F] border border-white/15 text-white text-sm focus:outline-none focus:border-[#0078D4]"
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FORM VARIANT: 2. EVENT NOTICE */}
          {isEventNotice && (
            <div className="space-y-5 p-5 rounded-2xl bg-[#07111F]/60 border border-white/5">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#22D3EE]">
                <Calendar className="w-4 h-4" />
                <span>Event Notice Template Parameters</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Event Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={assignedEvent?.name || eventName}
                  disabled={Boolean(assignedEvent?.name)}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g. Cloud & AI Dev Con 2026"
                  className={`w-full h-11 px-4 rounded-xl bg-[#07111F] border border-white/15 text-white text-sm focus:outline-none focus:border-[#0078D4] ${
                    assignedEvent ? "opacity-75 cursor-not-allowed bg-[#0D1B2A]" : ""
                  }`}
                  required
                />
                {assignedEvent && (
                  <p className="text-[11px] text-[#22D3EE] mt-1 font-mono">
                    * Locked to your assigned event: &quot;{assignedEvent.name}&quot;
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Presenters / Resource Persons <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={presenters}
                  onChange={(e) => setPresenters(e.target.value)}
                  placeholder="e.g. Dr. K. Ramasamy (HOD/IT), S. Arun Kumar (Azure MVP)"
                  className="w-full h-11 px-4 rounded-xl bg-[#07111F] border border-white/15 text-white text-sm focus:outline-none focus:border-[#0078D4]"
                  required
                />
                <span className="text-[11px] text-[#94A3B8] mt-1 block">
                  Separate multiple presenters with commas.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                    Event Venue <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={eventVenue}
                    onChange={(e) => setEventVenue(e.target.value)}
                    placeholder="e.g. IT Lab 3 / Auditorium"
                    className="w-full h-11 px-4 rounded-xl bg-[#07111F] border border-white/15 text-white text-sm focus:outline-none focus:border-[#0078D4]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                    Event Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    placeholder="e.g. 15th November 2026"
                    className="w-full h-11 px-4 rounded-xl bg-[#07111F] border border-white/15 text-white text-sm focus:outline-none focus:border-[#0078D4]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                    Event Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="e.g. 03:30 PM - 05:00 PM"
                    className="w-full h-11 px-4 rounded-xl bg-[#07111F] border border-white/15 text-white text-sm focus:outline-none focus:border-[#0078D4]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Additional Content (Optional)
                </label>
                <textarea
                  rows={3}
                  value={eventExtra}
                  onChange={(e) => setEventExtra(e.target.value)}
                  placeholder="e.g. Laptops with VS Code installed are recommended for hands-on exercises."
                  className="w-full p-4 rounded-xl bg-[#07111F] border border-white/15 text-white text-sm focus:outline-none focus:border-[#0078D4]"
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FORM VARIANT: 3. QUIZ WINNERS NOTICE */}
          {isQuizWinnersNotice && (
            <div className="space-y-5 p-5 rounded-2xl bg-[#07111F]/60 border border-white/5">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#22D3EE]">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Quiz Winners Notice Template Parameters</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Quiz Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={winnersQuizName}
                  onChange={(e) => setWinnersQuizName(e.target.value)}
                  placeholder="e.g. Weekly Cloud Computing & DevOps Challenge #3"
                  className="w-full h-11 px-4 rounded-xl bg-[#07111F] border border-white/15 text-white text-sm focus:outline-none focus:border-[#0078D4]"
                  required
                />
              </div>

              {/* Dynamic Winners List (NO serial numbers) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-[#CBD5E1]">
                    Winners List (Dynamic, Ordered — No Serial Numbers) <span className="text-red-400">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddWinner}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    Add Winner
                  </Button>
                </div>

                <div className="space-y-3">
                  {winners.map((win, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#0D1B2A] border border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          value={win.name}
                          onChange={(e) => handleWinnerChange(idx, "name", e.target.value)}
                          placeholder="Student Full Name"
                          className="w-full h-9 px-3 rounded-lg bg-[#07111F] border border-white/15 text-white text-xs focus:outline-none focus:border-[#0078D4]"
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <select
                          value={win.year}
                          onChange={(e) => handleWinnerChange(idx, "year", e.target.value)}
                          className="w-full h-9 px-2 rounded-lg bg-[#07111F] border border-white/15 text-white text-xs focus:outline-none focus:border-[#0078D4]"
                        >
                          <option value="I">I Year</option>
                          <option value="II">II Year</option>
                          <option value="III">III Year</option>
                          <option value="IV">IV Year</option>
                        </select>
                      </div>
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={win.department}
                          onChange={(e) => handleWinnerChange(idx, "department", e.target.value)}
                          placeholder="Department (e.g. CSE / IT)"
                          className="w-full h-9 px-3 rounded-lg bg-[#07111F] border border-white/15 text-white text-xs focus:outline-none focus:border-[#0078D4]"
                          required
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveWinner(idx)}
                          disabled={winners.length <= 1}
                          className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Remove Winner"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* DYNAMIC FORM VARIANT: 4. ACTIVE PARTICIPANTS NOTICE */}
          {isActiveParticipantsNotice && (
            <div className="space-y-5 p-5 rounded-2xl bg-[#07111F]/60 border border-white/5">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#22D3EE]">
                <Users className="w-4 h-4" />
                <span>Active Participants Notice Template Parameters</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Activity / Event Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  placeholder="e.g. Open Source Hack Night 2026"
                  className="w-full h-11 px-4 rounded-xl bg-[#07111F] border border-white/15 text-white text-sm focus:outline-none focus:border-[#0078D4]"
                  required
                />
              </div>

              {/* Dynamic Participants List (NO serial numbers) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-[#CBD5E1]">
                    Active Participants List (Dynamic, Ordered — No Serial Numbers) <span className="text-red-400">*</span>
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddParticipant}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    Add Participant
                  </Button>
                </div>

                <div className="space-y-3">
                  {participants.map((part, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#0D1B2A] border border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-5">
                        <input
                          type="text"
                          value={part.name}
                          onChange={(e) => handleParticipantChange(idx, "name", e.target.value)}
                          placeholder="Student Full Name"
                          className="w-full h-9 px-3 rounded-lg bg-[#07111F] border border-white/15 text-white text-xs focus:outline-none focus:border-[#0078D4]"
                          required
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <select
                          value={part.year}
                          onChange={(e) => handleParticipantChange(idx, "year", e.target.value)}
                          className="w-full h-9 px-2 rounded-lg bg-[#07111F] border border-white/15 text-white text-xs focus:outline-none focus:border-[#0078D4]"
                        >
                          <option value="I">I Year</option>
                          <option value="II">II Year</option>
                          <option value="III">III Year</option>
                          <option value="IV">IV Year</option>
                        </select>
                      </div>
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={part.department}
                          onChange={(e) => handleParticipantChange(idx, "department", e.target.value)}
                          placeholder="Department (e.g. CSE / IT)"
                          className="w-full h-9 px-3 rounded-lg bg-[#07111F] border border-white/15 text-white text-xs focus:outline-none focus:border-[#0078D4]"
                          required
                        />
                      </div>
                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipant(idx)}
                          disabled={participants.length <= 1}
                          className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Remove Participant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Additional Content (Optional)
                </label>
                <textarea
                  rows={3}
                  value={activeExtra}
                  onChange={(e) => setActiveExtra(e.target.value)}
                  placeholder="e.g. Certificates of appreciation will be issued to all active participants."
                  className="w-full p-4 rounded-xl bg-[#07111F] border border-white/15 text-white text-sm focus:outline-none focus:border-[#0078D4]"
                />
              </div>
            </div>
          )}

          {/* DYNAMIC FORM VARIANT: 5. PLACEMENT QUESTIONS NOTICE */}
          {isPlacementNotice && (
            <div className="space-y-5 p-5 rounded-2xl bg-[#07111F]/60 border border-white/5">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#22D3EE]">
                <Briefcase className="w-4 h-4" />
                <span>Placement Notice Template Parameters</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Placement Activity / Topic Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={placementTitle}
                  onChange={(e) => setPlacementTitle(e.target.value)}
                  placeholder="e.g. Microsoft & Amazon Technical Interview Prep"
                  className="w-full h-11 px-4 rounded-xl bg-[#07111F] border border-white/15 text-white text-sm focus:outline-none focus:border-[#0078D4]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Placement Portal URL / Link <span className="text-red-400">*</span>
                </label>
                <input
                  type="url"
                  value={placementLink}
                  onChange={(e) => setPlacementLink(e.target.value)}
                  placeholder="https://microsoft-campus-club-webpage.vercel.app/students-corner"
                  className="w-full h-11 px-4 rounded-xl bg-[#07111F] border border-white/15 text-white text-sm focus:outline-none focus:border-[#0078D4]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Additional Content / Motivation (Optional)
                </label>
                <textarea
                  rows={3}
                  value={placementExtra}
                  onChange={(e) => setPlacementExtra(e.target.value)}
                  placeholder="e.g. Gain hands-on practice on top MNC coding interview questions and mock tests."
                  className="w-full p-4 rounded-xl bg-[#07111F] border border-white/15 text-white text-sm focus:outline-none focus:border-[#0078D4]"
                />
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleOpenPreview}
                leftIcon={<Eye className="w-4 h-4 text-[#22D3EE]" />}
              >
                Preview Notice
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleDownloadCurrentPdf}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Download PDF
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={isSubmitting}
                onClick={() => handleSaveNotice("DRAFT")}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save as Draft
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                onClick={() => handleSaveNotice("PENDING_APPROVAL")}
                leftIcon={<Send className="w-4 h-4" />}
              >
                {currentStatus === "REJECTED" ? "Resubmit for Approval" : "Submit for Approval"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* MY NOTICES LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#94A3B8]">
            MY SUBMITTED &amp; DRAFT NOTICES ({myNotices.length})
          </h3>
          <button
            onClick={loadNotices}
            className="text-xs text-[#0078D4] hover:text-white flex items-center gap-1 font-mono"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="rounded-2xl bg-[#0D1B2A] border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#CBD5E1]">
              <thead className="bg-[#07111F] text-xs font-mono uppercase tracking-wider text-[#94A3B8] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4">Notice Title</th>
                  <th className="px-6 py-4">Notice Type</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-[#94A3B8]">
                      Loading notices...
                    </td>
                  </tr>
                ) : myNotices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#94A3B8]">
                      No notices created yet. Fill out the form above to save your first draft or submit for approval.
                    </td>
                  </tr>
                ) : (
                  myNotices.map((n) => (
                    <tr key={n.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#F8FAFC]">{n.title}</div>
                        {n.eventName && (
                          <span className="text-[11px] text-[#22D3EE] font-mono">
                            Event: {n.eventName}
                          </span>
                        )}
                        {n.rejectionReason && (
                          <p className="text-xs text-red-400 mt-1 italic">
                            Rejection: {n.rejectionReason}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-[#0078D4]/10 border border-[#0078D4]/20 text-[#22D3EE]">
                          {n.noticeType.replace(/_/g, " ")}
                        </span>
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
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/20">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(n.status === "DRAFT" || n.status === "REJECTED") && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditNotice(n)}
                              className="text-xs"
                            >
                              Edit
                            </Button>
                          )}

                          <a
                            href={`/api/notices/pdf?id=${n.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-[#22D3EE] hover:bg-white/10"
                            title="View PDF in New Tab"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          <a
                            href={`/api/notices/pdf?id=${n.id}&download=true`}
                            download
                            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FULL-VIEWPORT PDF PREVIEW MODAL */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-4xl h-[90vh] rounded-3xl bg-[#0D1B2A] border border-white/15 p-6 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#0078D4]" />
                <h3 className="text-base font-bold text-[#F8FAFC]">
                  Official Notice Template Preview
                </h3>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 bg-[#07111F] rounded-2xl border border-white/10 overflow-hidden relative flex items-center justify-center">
              {isPreviewLoading ? (
                <div className="flex items-center space-x-3 text-sm text-[#94A3B8]">
                  <span className="w-5 h-5 border-2 border-[#0078D4] border-t-transparent rounded-full animate-spin" />
                  <span>Stamping dynamic template PDF...</span>
                </div>
              ) : previewPdfUrl ? (
                <iframe
                  src={previewPdfUrl}
                  title="Notice PDF Preview"
                  className="w-full h-full rounded-2xl"
                />
              ) : (
                <p className="text-sm text-[#94A3B8]">Unable to preview PDF.</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#94A3B8] font-mono">
                Stamping onto supplied official MCC PDF template.
              </span>
              <div className="flex items-center gap-2">
                {previewPdfUrl && (
                  <a
                    href={previewPdfUrl}
                    download={`${(noticeTitle || getDefaultTitle()).replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0078D4] text-white hover:bg-[#0078D4]/90 transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Stamped PDF</span>
                  </a>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsPreviewOpen(false)}
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
