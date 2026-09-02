"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BriefcaseBusiness,
  CircleHelp,
  Gamepad2,
  Rss,
  History,
  Trophy,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Clock,
  Loader2,
} from "lucide-react";
import { StudentInfoModal } from "@/components/students-corner/StudentInfoModal";
import { PlacementTestRunner } from "@/components/students-corner/PlacementTestRunner";
import { QuizTestRunner } from "@/components/students-corner/QuizTestRunner";
import { WeeklyLeaderboard } from "@/components/students-corner/WeeklyLeaderboard";
import { HistoryQuestions } from "@/components/students-corner/HistoryQuestions";
import { MembershipForm } from "@/components/students-corner/MembershipForm";
import { FeedList } from "@/components/office-bearer/FeedCard";
import { OBAuthProvider, useOBAuth } from "@/components/office-bearer/OBAuthProvider";
import { Button } from "@/components/ui/Button";
import { StudentResultReport, StudentInfo, ACTIVE_PLACEMENT_SET, ACTIVE_QUIZ_SET } from "@/lib/studentState";
import { ActivityAvailabilityMap, INITIAL_ACTIVITY_AVAILABILITY } from "@/lib/adminState";
import { FileText } from "lucide-react";

type TabType =
  | "overview"
  | "placement-questions"
  | "general-quiz"
  | "technical-games"
  | "feed"
  | "history"
  | "leaderboard"
  | "membership";

function StudentsCornerInner() {
  const { publishedFeedPosts } = useOBAuth();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>("overview");

  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType | null;
    if (tabParam === "technical-games") {
      window.location.replace("https://technical-game-homepage.vercel.app/#games");
      return;
    }
    if (
      tabParam &&
      [
        "overview",
        "placement-questions",
        "general-quiz",
        "feed",
        "history",
        "leaderboard",
        "membership",
      ].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Student Info Modal State
  const [studentInfoModalOpen, setStudentInfoModalOpen] = useState(false);
  const [targetTestType, setTargetTestType] = useState<"Placement Questions" | "General Quiz">("Placement Questions");
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);

  // MongoDB-backed Leaderboard publication state & rankings
  const [leaderboardPublished, setLeaderboardPublished] = useState<boolean>(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<any[]>([]);
  const [leaderboardPublishedBy, setLeaderboardPublishedBy] = useState<string | null>(null);
  const [leaderboardPublishedByRole, setLeaderboardPublishedByRole] = useState<string | null>(null);
  const [leaderboardPublishedAt, setLeaderboardPublishedAt] = useState<string | null>(null);
  const [leaderboardWeekNumber, setLeaderboardWeekNumber] = useState<number>(1);

  // Activity Availability State & Enforcement
  const [activityAvailability, setActivityAvailability] = useState<ActivityAvailabilityMap>(INITIAL_ACTIVITY_AVAILABILITY);
  const [timelines, setTimelines] = useState<
    Record<
      string,
      {
        startAt?: string | null;
        endAt?: string | null;
        title?: string;
        timerMinutes?: number;
        questionsToDisplay?: number;
        totalQuestions?: number;
      }
    >
  >({});
  const [testInfoPreviewOpen, setTestInfoPreviewOpen] = useState(false);
  const [isValidatingTest, setIsValidatingTest] = useState<string | null>(null);

  interface AvailabilityModalState {
    isOpen: boolean;
    type: "EXPIRED" | "CLOSED" | "UPCOMING" | "ERROR";
    title: string;
    message: string;
    details?: string | null;
  }
  const [availabilityNotice, setAvailabilityNotice] = useState<AvailabilityModalState | null>(null);

  const fetchAvailability = async () => {
    try {
      const res = await fetch("/api/activity-availability");
      if (res.ok) {
        const data = await res.json();
        if (data.activityAvailability) {
          setActivityAvailability(data.activityAvailability);
        }
        if (data.timelines) {
          setTimelines(data.timelines);
        }
      }
    } catch (e) {
      console.error("Failed to fetch activity availability", e);
    }
  };

  const fetchLeaderboardData = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        setLeaderboardPublished(Boolean(data.isPublished));
        setLeaderboardEntries(data.entries || []);
        setLeaderboardPublishedBy(data.publishedBy || null);
        setLeaderboardPublishedByRole(data.publishedByRole || null);
        setLeaderboardPublishedAt(data.publishedAt || null);
        setLeaderboardWeekNumber(data.weekNumber || 1);
      }
    } catch (e) {
      console.error("Failed to fetch leaderboard data", e);
    }
  };

  const formatTimelineDisplay = (dateStr?: string | null) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } catch {
      return dateStr || "";
    }
  };

  React.useEffect(() => {
    fetchAvailability();
    fetchLeaderboardData();
  }, [activeTab]);

  const [currentEventData, setCurrentEventData] = React.useState<{
    testTitle?: string;
    timerMinutes?: number;
    totalQuestions?: number;
    questions?: any[];
  } | null>(null);

  const handleStartTestFlow = async (testType: "Placement Questions" | "General Quiz") => {
    // 0. Quick client-side check if known to be expired or closed
    const currentStatus = activityAvailability[testType] || "OPEN";
    const timeline = timelines[testType];
    const isClientExpired = timeline?.endAt && new Date() > new Date(timeline.endAt);

    if (currentStatus === "CLOSED" || isClientExpired) {
      const endText = timeline?.endAt ? ` (Ended on ${formatTimelineDisplay(timeline.endAt)})` : "";
      setAvailabilityNotice({
        isOpen: true,
        type: "EXPIRED",
        title: testType === "Placement Questions" ? "Placement Question is Expired" : `${testType} is Expired`,
        message: `This ${testType.toLowerCase()} assessment has expired and submissions are now closed.${endText} Please check back later for upcoming rounds.`,
        details: timeline?.endAt ? `Closed: ${formatTimelineDisplay(timeline.endAt)}` : null,
      });
      return;
    }

    if (currentStatus === "COMING SOON" || currentStatus === "UPCOMING") {
      const startText = timeline?.startAt ? ` (Opens at ${formatTimelineDisplay(timeline.startAt)})` : "";
      setAvailabilityNotice({
        isOpen: true,
        type: "UPCOMING",
        title: `${testType} Not Started Yet`,
        message: `This ${testType.toLowerCase()} assessment has not started yet.${startText} Please check back at the scheduled start time.`,
        details: timeline?.startAt ? `Opens: ${formatTimelineDisplay(timeline.startAt)}` : null,
      });
      return;
    }

    // 1. Live backend verification from MongoDB BEFORE entering details
    setIsValidatingTest(testType);
    try {
      const res = await fetch("/api/students-corner/validate-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityName: testType }),
      });
      const data = await res.json();
      setIsValidatingTest(null);

      if (!res.ok || !data.allowed) {
        setActivityAvailability((prev) => ({ ...prev, [testType]: data.status || "CLOSED" }));

        // Specifically check for EXPIRED status / message
        if (data.isExpired || data.status === "EXPIRED" || (data.message && data.message.toLowerCase().includes("ended"))) {
          setAvailabilityNotice({
            isOpen: true,
            type: "EXPIRED",
            title: testType === "Placement Questions" ? "Placement Question is Expired" : `${testType} is Expired`,
            message: data.message || `This ${testType.toLowerCase()} assessment has expired. Submissions are closed.`,
            details: data.endAt ? `Closed: ${formatTimelineDisplay(data.endAt)}` : null,
          });
          return;
        }

        if (data.status === "UPCOMING") {
          setAvailabilityNotice({
            isOpen: true,
            type: "UPCOMING",
            title: `${testType} Not Started Yet`,
            message: data.message || `This assessment has not started yet.`,
            details: data.startAt ? `Opens: ${formatTimelineDisplay(data.startAt)}` : null,
          });
          return;
        }

        setAvailabilityNotice({
          isOpen: true,
          type: "CLOSED",
          title: `${testType} Unavailable`,
          message: data.message || `"${testType}" is currently closed by the administrator.`,
        });
        return;
      }

      if (data.questions || data.testTitle || data.timerMinutes) {
        setCurrentEventData({
          testTitle: data.testTitle,
          timerMinutes: data.timerMinutes,
          totalQuestions: data.totalQuestions,
          questions: data.questions,
        });
      }
    } catch (err) {
      setIsValidatingTest(null);
      console.error("Availability validation network error:", err);
      setAvailabilityNotice({
        isOpen: true,
        type: "ERROR",
        title: "Connection Error",
        message: "Unable to verify activity availability right now. Please check your network connection and try again.",
      });
      return;
    }

    setAvailabilityNotice(null);
    setTargetTestType(testType);
    setTestInfoPreviewOpen(true);
  };

  const handleStudentInfoProceed = (info: StudentInfo) => {
    setStudentInfo(info);
    setStudentInfoModalOpen(false);
    if (targetTestType === "Placement Questions") {
      setActiveTab("placement-questions");
    } else {
      setActiveTab("general-quiz");
    }
  };

  const handleTestFinished = (report: StudentResultReport) => {
    console.log("Test finished by student:", report);
  };

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "overview", label: "Overview", icon: Sparkles },
    { id: "placement-questions", label: "Placement Questions", icon: BriefcaseBusiness },
    { id: "general-quiz", label: "General Quiz", icon: CircleHelp },
    { id: "technical-games", label: "Technical Games", icon: Gamepad2 },
    { id: "feed", label: "Feed", icon: Rss },
    { id: "history", label: "History Questions", icon: History },
    { id: "leaderboard", label: "Placement Leaderboard", icon: Trophy },
    { id: "membership", label: "Membership Form", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#07111F] text-[#F8FAFC] flex flex-col">
      {/* Platform Header */}
      <header className="sticky top-0 z-30 bg-[#07111F]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <img
            src="/images/mcc-logo.jpeg"
            alt="MCC Logo"
            className="h-9 w-auto object-contain rounded-lg"
          />
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-[#F8FAFC]">
              MCC STUDENTS CORNER
            </span>
            <span className="text-[10px] font-mono text-[#22D3EE] uppercase tracking-wider">
              Public Activity & Learning Hub
            </span>
          </div>
        </Link>

        {studentInfo && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-[#F8FAFC]">{studentInfo.name}</span>
            <span className="text-[#94A3B8] text-[11px] font-mono">({studentInfo.department})</span>
          </div>
        )}
      </header>

      {/* Responsive Navigation Tab Bar */}
      <nav className="bg-[#0D1B2A] border-b border-white/10 px-4 sm:px-8 overflow-x-auto no-scrollbar sticky top-[65px] z-20">
        <div className="flex space-x-1 sm:space-x-2 min-w-max py-2.5">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            if (t.id === "technical-games") {
              return (
                <a
                  key={t.id}
                  href="https://technical-game-homepage.vercel.app/#games"
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all text-[#CBD5E1] hover:text-[#0078D4] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                >
                  <Icon className="w-4 h-4 text-[#22D3EE]" />
                  <span>{t.label}</span>
                </a>
              );
            }
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#0078D4] text-white shadow-md shadow-[#0078D4]/20"
                    : "text-[#CBD5E1] hover:text-[#0078D4] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#22D3EE]"}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Tab Body */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* TAB 1: OVERVIEW HOME */}
        {activeTab === "overview" && (
          <div className="space-y-10 animate-fade-in">
            {/* Hero Overview Banner */}
            <div className="students-corner-hero p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#0D1B2A] via-[#07111F] to-[#0078D4]/20 border border-white/10 shadow-2xl relative overflow-hidden space-y-4">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#0078D4]/10 border border-[#0078D4]/30 text-xs font-mono text-[#22D3EE]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>STUDENT ACTIVITY HUB</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-[#F8FAFC] tracking-tight max-w-2xl leading-tight">
                Empowering Campus Developers & Leaders.
              </h1>
              <p className="text-sm sm:text-base text-[#CBD5E1] max-w-xl leading-relaxed">
                Participate in weekly placement assessments, test your cloud knowledge with general quizzes, follow live community feeds, and track official weekly leaderboards.
              </p>
            </div>

            {/* Quick Activity Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Placement Questions */}
              {(() => {
                const status = activityAvailability["Placement Questions"] || "OPEN";
                const timeline = timelines["Placement Questions"];
                return (
                  <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl flex flex-col justify-between space-y-4 hover:border-[#0078D4]/40 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-[#0078D4]/20 border border-[#0078D4]/30 flex items-center justify-center text-[#22D3EE]">
                          <BriefcaseBusiness className="w-5 h-5" />
                        </div>
                        {status === "OPEN" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            OPEN
                          </span>
                        )}
                        {status === "CLOSED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            CLOSED
                          </span>
                        )}
                        {(status === "COMING SOON" || status === "UPCOMING") && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            {status === "UPCOMING" ? "UPCOMING" : "COMING SOON"}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[11px] font-mono text-[#0078D4] block mb-0.5">Placement Challenge</span>
                        <h3 className="text-lg font-bold text-[#F8FAFC]">{timeline?.title || "Placement Questions"}</h3>
                        {/* Timeline Information */}
                        {status === "OPEN" && timeline?.endAt && (
                          <span className="text-[11px] font-mono text-emerald-400 block mt-0.5">
                            Ends: {formatTimelineDisplay(timeline.endAt)}
                          </span>
                        )}
                        {status === "UPCOMING" && timeline?.startAt && (
                          <span className="text-[11px] font-mono text-amber-400 block mt-0.5">
                            Starts: {formatTimelineDisplay(timeline.startAt)}
                          </span>
                        )}
                        {status === "CLOSED" && timeline?.endAt && (
                          <span className="text-[11px] font-mono text-red-400 block mt-0.5">
                            Ended: {formatTimelineDisplay(timeline.endAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#CBD5E1] leading-relaxed">
                        Practice interview coding sets ({timeline?.questionsToDisplay || 4} Questions • {timeline?.timerMinutes || 30} Minutes) with instant score calculation and question breakdown.
                      </p>
                    </div>
                    <Button
                      onClick={() => handleStartTestFlow("Placement Questions")}
                      variant="primary"
                      size="md"
                      disabled={isValidatingTest === "Placement Questions"}
                      leftIcon={isValidatingTest === "Placement Questions" ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                      rightIcon={isValidatingTest !== "Placement Questions" ? <ArrowRight className="w-4 h-4" /> : undefined}
                      className={status !== "OPEN" ? "opacity-75" : ""}
                    >
                      {isValidatingTest === "Placement Questions"
                        ? "Verifying..."
                        : status === "OPEN"
                        ? "Start Placement Test"
                        : status === "UPCOMING"
                        ? "Upcoming Assessment"
                        : "Assessment Closed"}
                    </Button>
                  </div>
                );
              })()}

              {/* Card 2: General Quiz */}
              {(() => {
                const status = activityAvailability["General Quiz"] || "OPEN";
                const timeline = timelines["General Quiz"];
                return (
                  <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl flex flex-col justify-between space-y-4 hover:border-[#0078D4]/40 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                          <CircleHelp className="w-5 h-5" />
                        </div>
                        {status === "OPEN" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            OPEN
                          </span>
                        )}
                        {status === "CLOSED" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            CLOSED
                          </span>
                        )}
                        {(status === "COMING SOON" || status === "UPCOMING") && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            {status === "UPCOMING" ? "UPCOMING" : "COMING SOON"}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[11px] font-mono text-blue-400 block mb-0.5">Weekly Challenge</span>
                        <h3 className="text-lg font-bold text-[#F8FAFC]">{timeline?.title || "General Quiz"}</h3>
                        {/* Timeline Information */}
                        {status === "OPEN" && timeline?.endAt && (
                          <span className="text-[11px] font-mono text-emerald-400 block mt-0.5">
                            Ends: {formatTimelineDisplay(timeline.endAt)}
                          </span>
                        )}
                        {status === "UPCOMING" && timeline?.startAt && (
                          <span className="text-[11px] font-mono text-amber-400 block mt-0.5">
                            Starts: {formatTimelineDisplay(timeline.startAt)}
                          </span>
                        )}
                        {status === "CLOSED" && timeline?.endAt && (
                          <span className="text-[11px] font-mono text-red-400 block mt-0.5">
                            Ended: {formatTimelineDisplay(timeline.endAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#CBD5E1] leading-relaxed">
                        Timed trivia speed rounds ({timeline?.questionsToDisplay || 3} Questions • {timeline?.timerMinutes || 15} Minutes) covering cloud fundamentals, AI models, and software engineering.
                      </p>
                    </div>
                    <Button
                      onClick={() => handleStartTestFlow("General Quiz")}
                      variant="primary"
                      size="md"
                      disabled={isValidatingTest === "General Quiz"}
                      leftIcon={isValidatingTest === "General Quiz" ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                      rightIcon={isValidatingTest !== "General Quiz" ? <ArrowRight className="w-4 h-4" /> : undefined}
                      className={status !== "OPEN" ? "opacity-75" : ""}
                    >
                      {isValidatingTest === "General Quiz"
                        ? "Verifying..."
                        : status === "OPEN"
                        ? "Take General Quiz"
                        : status === "UPCOMING"
                        ? "Upcoming Quiz"
                        : "Quiz Closed"}
                    </Button>
                  </div>
                );
              })()}

              {/* Card 3: Technical Games */}
              {(() => {
                return (
                  <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl flex flex-col justify-between space-y-4 hover:border-[#0078D4]/40 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Gamepad2 className="w-5 h-5" />
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          LIVE ARENA
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-mono text-emerald-400 block mb-0.5">Hands-on Debugging</span>
                        <h3 className="text-lg font-bold text-[#F8FAFC]">Technical Games</h3>
                      </div>
                      <p className="text-xs text-[#CBD5E1] leading-relaxed">
                        Competitive micro-challenges, IoT speed debugging, and CTF technical gaming arenas.
                      </p>
                    </div>
                    <Button
                      href="https://technical-game-homepage.vercel.app/#games"
                      variant="secondary"
                      size="md"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Play Technical Games
                    </Button>
                  </div>
                );
              })()}
            </div>

            {/* Common Feed Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-xl font-bold text-[#F8FAFC]">Community Feed Updates</h3>
                <button
                  onClick={() => setActiveTab("feed")}
                  className="text-xs text-[#0078D4] hover:underline font-semibold"
                >
                  View Full Feed →
                </button>
              </div>
              <FeedList posts={publishedFeedPosts.slice(0, 2)} />
            </div>
          </div>
        )}

        {/* TAB 2: PLACEMENT QUESTIONS */}
        {activeTab === "placement-questions" && (
          <div>
            {(activityAvailability["Placement Questions"] || "OPEN") === "CLOSED" ? (
              <div className="p-12 text-center rounded-2xl bg-[#0D1B2A] border border-red-500/20 max-w-xl mx-auto space-y-5">
                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#F8FAFC]">Placement Questions Closed</h3>
                  <p className="text-xs text-[#CBD5E1] mt-1.5 leading-relaxed">
                    {timelines["Placement Questions"]?.endAt
                      ? `This assessment closed on ${formatTimelineDisplay(timelines["Placement Questions"]?.endAt)}. Please check back later for upcoming rounds.`
                      : "This assessment is currently closed by the administrator. Please check back later or explore other live MCC activities."}
                  </p>
                </div>
                <Button
                  onClick={() => setActiveTab("overview")}
                  variant="outline"
                  size="md"
                >
                  Return to Overview
                </Button>
              </div>
            ) : (activityAvailability["Placement Questions"] || "OPEN") === "UPCOMING" ? (
              <div className="p-12 text-center rounded-2xl bg-[#0D1B2A] border border-amber-500/20 max-w-xl mx-auto space-y-5">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#F8FAFC]">Placement Questions Upcoming</h3>
                  <p className="text-xs text-[#CBD5E1] mt-1.5 leading-relaxed">
                    {timelines["Placement Questions"]?.startAt
                      ? `This assessment will open on ${formatTimelineDisplay(timelines["Placement Questions"]?.startAt)}. Please check back at the scheduled start time.`
                      : "This assessment is scheduled to open soon. Please check back later."}
                  </p>
                </div>
                <Button
                  onClick={() => setActiveTab("overview")}
                  variant="outline"
                  size="md"
                >
                  Return to Overview
                </Button>
              </div>
            ) : !studentInfo ? (
              <div className="p-12 text-center rounded-2xl bg-[#0D1B2A] border border-white/10 max-w-xl mx-auto space-y-5">
                <BriefcaseBusiness className="w-12 h-12 text-[#0078D4] mx-auto" />
                <div>
                  <h3 className="text-2xl font-bold text-[#F8FAFC]">
                    {timelines["Placement Questions"]?.title || "Placement Questions Assessment"}
                  </h3>
                  <p className="text-xs text-[#CBD5E1] mt-1">
                    {timelines["Placement Questions"]?.questionsToDisplay || 4} Questions • {timelines["Placement Questions"]?.timerMinutes || ACTIVE_PLACEMENT_SET.timerMinutes} Minutes
                  </p>
                  {timelines["Placement Questions"]?.endAt && (
                    <p className="text-xs text-emerald-400 mt-1 font-mono">
                      Closes: {formatTimelineDisplay(timelines["Placement Questions"]?.endAt)}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => handleStartTestFlow("Placement Questions")}
                  variant="primary"
                  size="lg"
                  disabled={isValidatingTest === "Placement Questions"}
                  leftIcon={isValidatingTest === "Placement Questions" ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                  rightIcon={isValidatingTest !== "Placement Questions" ? <ArrowRight className="w-4 h-4" /> : undefined}
                >
                  {isValidatingTest === "Placement Questions" ? "Checking Availability..." : "Enter Details & Start Test"}
                </Button>
              </div>
            ) : (
              <PlacementTestRunner
                studentInfo={studentInfo}
                customQuestions={currentEventData?.questions}
                timerMinutes={currentEventData?.timerMinutes}
                testTitle={currentEventData?.testTitle}
                onFinishTest={handleTestFinished}
              />
            )}
          </div>
        )}

        {/* TAB 3: GENERAL QUIZ */}
        {activeTab === "general-quiz" && (
          <div>
            {(activityAvailability["General Quiz"] || "OPEN") === "CLOSED" ? (
              <div className="p-12 text-center rounded-2xl bg-[#0D1B2A] border border-red-500/20 max-w-xl mx-auto space-y-5">
                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#F8FAFC]">General Quiz Closed</h3>
                  <p className="text-xs text-[#CBD5E1] mt-1.5 leading-relaxed">
                    {timelines["General Quiz"]?.endAt
                      ? `This quiz closed on ${formatTimelineDisplay(timelines["General Quiz"]?.endAt)}. Please check back later for upcoming trivia challenges.`
                      : "This quiz is currently closed by the administrator. Please check back later or explore other live MCC activities."}
                  </p>
                </div>
                <Button
                  onClick={() => setActiveTab("overview")}
                  variant="outline"
                  size="md"
                >
                  Return to Overview
                </Button>
              </div>
            ) : (activityAvailability["General Quiz"] || "OPEN") === "UPCOMING" ? (
              <div className="p-12 text-center rounded-2xl bg-[#0D1B2A] border border-amber-500/20 max-w-xl mx-auto space-y-5">
                <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#F8FAFC]">General Quiz Upcoming</h3>
                  <p className="text-xs text-[#CBD5E1] mt-1.5 leading-relaxed">
                    {timelines["General Quiz"]?.startAt
                      ? `This quiz will open on ${formatTimelineDisplay(timelines["General Quiz"]?.startAt)}. Please check back at the scheduled start time.`
                      : "This quiz is scheduled to open soon. Please check back later."}
                  </p>
                </div>
                <Button
                  onClick={() => setActiveTab("overview")}
                  variant="outline"
                  size="md"
                >
                  Return to Overview
                </Button>
              </div>
            ) : !studentInfo ? (
              <div className="p-12 text-center rounded-2xl bg-[#0D1B2A] border border-white/10 max-w-xl mx-auto space-y-5">
                <CircleHelp className="w-12 h-12 text-blue-400 mx-auto" />
                <div>
                  <h3 className="text-2xl font-bold text-[#F8FAFC]">
                    {timelines["General Quiz"]?.title || "General Quiz Trivia"}
                  </h3>
                  <p className="text-xs text-[#CBD5E1] mt-1">
                    {timelines["General Quiz"]?.questionsToDisplay || 3} Questions • {timelines["General Quiz"]?.timerMinutes || ACTIVE_QUIZ_SET.timerMinutes} Minutes
                  </p>
                  {timelines["General Quiz"]?.endAt && (
                    <p className="text-xs text-emerald-400 mt-1 font-mono">
                      Closes: {formatTimelineDisplay(timelines["General Quiz"]?.endAt)}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => handleStartTestFlow("General Quiz")}
                  variant="primary"
                  size="lg"
                  disabled={isValidatingTest === "General Quiz"}
                  leftIcon={isValidatingTest === "General Quiz" ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                  rightIcon={isValidatingTest !== "General Quiz" ? <ArrowRight className="w-4 h-4" /> : undefined}
                >
                  {isValidatingTest === "General Quiz" ? "Checking Availability..." : "Enter Details & Start Quiz"}
                </Button>
              </div>
            ) : (
              <QuizTestRunner
                studentInfo={studentInfo}
                customQuestions={currentEventData?.questions}
                timerMinutes={currentEventData?.timerMinutes}
                testTitle={currentEventData?.testTitle}
                onFinishTest={handleTestFinished}
              />
            )}
          </div>
        )}

        {/* TAB 4: TECHNICAL GAMES */}
        {activeTab === "technical-games" && (
          <div className="space-y-6 max-w-4xl mx-auto animate-fade-in text-center py-8">
            <div className="p-8 sm:p-12 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-2xl space-y-6 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <Gamepad2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#F8FAFC]">MCC Technical Games</h3>
                <p className="text-xs text-[#CBD5E1] mt-2 leading-relaxed">
                  Participate in hands-on technical micro-challenges, IoT speed debugging, and CTF coding arenas hosted on the official Technical Games platform.
                </p>
              </div>
              <Button
                href="https://technical-game-homepage.vercel.app/#games"
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-[#0078D4] hover:bg-[#0078D4]/80 w-full sm:w-auto"
              >
                Launch Technical Games Arena
              </Button>
            </div>
          </div>
        )}

        {/* TAB 5: FEED */}
        {activeTab === "feed" && (
          <div className="space-y-6 animate-fade-in">
            <div className="pb-3 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[#F8FAFC]">Common MCC Feed</h2>
              <span className="text-xs font-mono text-[#94A3B8]">
                {publishedFeedPosts.length} Live Posts
              </span>
            </div>
            <FeedList posts={publishedFeedPosts} />
          </div>
        )}

        {/* TAB 6: HISTORY QUESTIONS */}
        {activeTab === "history" && <HistoryQuestions />}

        {/* TAB 7: WEEKLY LEADERBOARD */}
        {activeTab === "leaderboard" && (
          <WeeklyLeaderboard
            isPublished={leaderboardPublished}
            entries={leaderboardEntries}
            publishedBy={leaderboardPublishedBy}
            publishedByRole={leaderboardPublishedByRole}
            publishedAt={leaderboardPublishedAt}
            weekNumber={leaderboardWeekNumber}
          />
        )}

        {/* TAB 8: MEMBERSHIP FORM */}
        {activeTab === "membership" && <MembershipForm />}
      </main>

      {/* Test Security Guidelines / Info Preview Modal */}
      {testInfoPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setTestInfoPreviewOpen(false)}
              className="absolute top-5 right-5 text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#0078D4]/20 border border-[#0078D4]/30 text-[#22D3EE] flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F8FAFC]">
                {targetTestType === "Placement Questions" ? "Placement Assessment Protocol" : "General Quiz Instructions"}
              </h3>
              <p className="text-xs text-[#CBD5E1]">
                Please review the assessment instructions before proceeding to enter your details.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#07111F] border border-white/10 text-xs">
              <div>
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Questions</span>
                <span className="font-bold text-[#F8FAFC]">
                  {currentEventData?.totalQuestions
                    ? `${currentEventData.totalQuestions} Questions`
                    : targetTestType === "Placement Questions"
                    ? `${timelines["Placement Questions"]?.questionsToDisplay || 4} Questions`
                    : `${timelines["General Quiz"]?.questionsToDisplay || 3} Questions`}
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Duration</span>
                <span className="font-bold text-[#22D3EE]">
                  {currentEventData?.timerMinutes
                    ? `${currentEventData.timerMinutes} Minutes`
                    : targetTestType === "Placement Questions"
                    ? `${timelines["Placement Questions"]?.timerMinutes || ACTIVE_PLACEMENT_SET.timerMinutes} Minutes`
                    : `${timelines["General Quiz"]?.timerMinutes || ACTIVE_QUIZ_SET.timerMinutes} Minutes`}
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Attempts Allowed</span>
                <span className="font-semibold text-amber-400">1 Attempt</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#07111F] border border-white/10 space-y-2.5 text-xs text-[#CBD5E1]">
              <div className="space-y-2">
                <p className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Single-attempt assessment: You may only submit this test once.</span>
                </p>
                <p className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Ensure a stable internet connection throughout the test duration.</span>
                </p>
                <p className="flex items-start space-x-2">
                  <span className="text-[#0078D4] font-bold">•</span>
                  <span>The timer starts as soon as you begin the assessment.</span>
                </p>
                {targetTestType === "Placement Questions" && (
                  <p className="flex items-start space-x-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>Full-screen mode is enforced. Tab switching or exiting full-screen records security violations.</span>
                  </p>
                )}
                <p className="flex items-start space-x-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Your final score and detailed report are calculated securely by the server and displayed immediately.</span>
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setTestInfoPreviewOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setTestInfoPreviewOpen(false);
                  setStudentInfoModalOpen(true);
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                I Understand & Enter Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Student Information Modal (No OTP) */}
      <StudentInfoModal
        isOpen={studentInfoModalOpen}
        testType={targetTestType}
        testTitle={currentEventData?.testTitle || (targetTestType === "Placement Questions" ? ACTIVE_PLACEMENT_SET.title : ACTIVE_QUIZ_SET.title)}
        onClose={() => setStudentInfoModalOpen(false)}
        onProceed={handleStudentInfoProceed}
        onExpired={(msg) => {
          setAvailabilityNotice({
            isOpen: true,
            type: "EXPIRED",
            title: targetTestType === "Placement Questions" ? "Placement Question is Expired" : `${targetTestType} is Expired`,
            message: msg,
          });
        }}
      />

      {/* Activity Availability Dialog Box Modal */}
      {availabilityNotice?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 sm:p-7 shadow-2xl space-y-5 text-center relative">
            <button
              onClick={() => setAvailabilityNotice(null)}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {availabilityNotice.type === "EXPIRED" && (
              <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
                <Clock className="w-7 h-7" />
              </div>
            )}
            {availabilityNotice.type === "UPCOMING" && (
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                <Clock className="w-7 h-7" />
              </div>
            )}
            {(availabilityNotice.type === "CLOSED" || availabilityNotice.type === "ERROR") && (
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                <AlertTriangle className="w-7 h-7" />
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#F8FAFC]">
                {availabilityNotice.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
                {availabilityNotice.message}
              </p>
            </div>

            {availabilityNotice.details && (
              <div className="p-2.5 rounded-xl bg-[#07111F] border border-white/10 text-xs font-mono text-[#94A3B8]">
                {availabilityNotice.details}
              </div>
            )}

            <div className="pt-2">
              <Button
                variant={availabilityNotice.type === "EXPIRED" ? "primary" : "outline"}
                size="md"
                className={`w-full ${availabilityNotice.type === "EXPIRED" ? "bg-rose-600 hover:bg-rose-700 text-white" : ""}`}
                onClick={() => setAvailabilityNotice(null)}
              >
                Understand & Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentsCornerPage() {
  return (
    <OBAuthProvider>
      <Suspense fallback={null}>
        <StudentsCornerInner />
      </Suspense>
    </OBAuthProvider>
  );
}
