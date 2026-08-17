"use client";

import React, { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { StudentOTPModal } from "@/components/students-corner/StudentOTPModal";
import { PlacementTestRunner } from "@/components/students-corner/PlacementTestRunner";
import { QuizTestRunner } from "@/components/students-corner/QuizTestRunner";
import { WeeklyLeaderboard } from "@/components/students-corner/WeeklyLeaderboard";
import { HistoryQuestions } from "@/components/students-corner/HistoryQuestions";
import { MembershipForm } from "@/components/students-corner/MembershipForm";
import { FeedList } from "@/components/office-bearer/FeedCard";
import { OBAuthProvider, useOBAuth } from "@/components/office-bearer/OBAuthProvider";
import { Button } from "@/components/ui/Button";
import { StudentResultReport, ACTIVE_PLACEMENT_SET, ACTIVE_QUIZ_SET } from "@/lib/studentState";
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

  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // OTP Identity Modal State
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [targetTestType, setTargetTestType] = useState<"Placement Questions" | "General Quiz">("Placement Questions");
  const [verifiedStudent, setVerifiedStudent] = useState<{ username: string; email: string } | null>(null);

  // Admin Leaderboard publication state simulation (default false until Admin approves!)
  const [leaderboardPublished, setLeaderboardPublished] = useState<boolean>(false);

  // Activity Availability State & Enforcement
  const [activityAvailability, setActivityAvailability] = useState<ActivityAvailabilityMap>(INITIAL_ACTIVITY_AVAILABILITY);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [testInfoPreviewOpen, setTestInfoPreviewOpen] = useState(false);

  const fetchAvailability = async () => {
    try {
      const res = await fetch("/api/activity-availability");
      if (res.ok) {
        const data = await res.json();
        if (data.activityAvailability) {
          setActivityAvailability(data.activityAvailability);
        }
      }
    } catch (e) {
      console.error("Failed to fetch activity availability", e);
    }
  };

  React.useEffect(() => {
    fetchAvailability();
  }, [activeTab]);

  const handleStartTestFlow = async (testType: "Placement Questions" | "General Quiz") => {
    // 1. Live backend verification from MongoDB
    try {
      const res = await fetch("/api/students-corner/validate-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityName: testType }),
      });
      const data = await res.json();
      if (!res.ok || !data.allowed) {
        setBlockedMessage(data.message || `"${testType}" is currently closed by the administrator.`);
        setActivityAvailability((prev) => ({ ...prev, [testType]: data.status || "CLOSED" }));
        return;
      }
    } catch (err) {
      console.error("Availability validation network error:", err);
    }

    const status = activityAvailability[testType] || "OPEN";

    if (status === "CLOSED") {
      setBlockedMessage(`"${testType}" is currently closed by the administrator.`);
      return;
    }

    if (status === "COMING SOON") {
      setBlockedMessage(`"${testType}" is not available yet.`);
      return;
    }

    setBlockedMessage(null);
    setTargetTestType(testType);
    setTestInfoPreviewOpen(true);
  };

  const handleOtpVerified = (username: string, email: string) => {
    setVerifiedStudent({ username, email });
    setOtpModalOpen(false);
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
    { id: "leaderboard", label: "Weekly Leaderboard", icon: Trophy },
    { id: "membership", label: "Membership Form", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#07111F] text-[#F8FAFC] flex flex-col">
      {/* Platform Header */}
      <header className="sticky top-0 z-30 bg-[#07111F]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="grid grid-cols-2 gap-0.5 w-7 h-7 p-1 rounded bg-white/5 border border-white/10 group-hover:border-[#0078D4]/50 transition-colors">
            <span className="bg-[#00A4EF] rounded-[1px]" />
            <span className="bg-[#7FBA00] rounded-[1px]" />
            <span className="bg-[#F25022] rounded-[1px]" />
            <span className="bg-[#FFB900] rounded-[1px]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-[#F8FAFC]">
              MCC STUDENTS CORNER
            </span>
            <span className="text-[10px] font-mono text-[#22D3EE] uppercase tracking-wider">
              Public Activity & Learning Hub
            </span>
          </div>
        </Link>

        {verifiedStudent && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#0D1B2A] border border-white/10 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">{verifiedStudent.username}</span>
            <span className="text-[#94A3B8] text-[11px] font-mono">Verified Candidate</span>
          </div>
        )}
      </header>

      {/* Responsive Navigation Tab Bar */}
      <nav className="bg-[#0D1B2A] border-b border-white/10 px-4 sm:px-8 overflow-x-auto no-scrollbar sticky top-[65px] z-20">
        <div className="flex space-x-1 sm:space-x-2 min-w-max py-2.5">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#0078D4] text-white shadow-md shadow-[#0078D4]/20"
                    : "text-[#CBD5E1] hover:text-white hover:bg-white/[0.06]"
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
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#0D1B2A] via-[#07111F] to-[#0078D4]/20 border border-white/10 shadow-2xl relative overflow-hidden space-y-4">
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
                        {status === "COMING SOON" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            COMING SOON
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[11px] font-mono text-[#0078D4] block mb-0.5">Placement Challenge</span>
                        <h3 className="text-lg font-bold text-[#F8FAFC]">Placement Questions</h3>
                      </div>
                      <p className="text-xs text-[#CBD5E1] leading-relaxed">
                        Practice interview coding sets (4 Questions • 30 Minutes) with email OTP verification and secure test environment.
                      </p>
                    </div>
                    <Button
                      onClick={() => handleStartTestFlow("Placement Questions")}
                      variant="primary"
                      size="md"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Start Placement Test
                    </Button>
                  </div>
                );
              })()}

              {/* Card 2: General Quiz */}
              {(() => {
                const status = activityAvailability["General Quiz"] || "OPEN";
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
                        {status === "COMING SOON" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            COMING SOON
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[11px] font-mono text-blue-400 block mb-0.5">Weekly Challenge</span>
                        <h3 className="text-lg font-bold text-[#F8FAFC]">General Quiz</h3>
                      </div>
                      <p className="text-xs text-[#CBD5E1] leading-relaxed">
                        Timed trivia speed rounds (3 Questions • 15 Minutes) covering cloud fundamentals, AI models, and software engineering.
                      </p>
                    </div>
                    <Button
                      onClick={() => handleStartTestFlow("General Quiz")}
                      variant="primary"
                      size="md"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Take General Quiz
                    </Button>
                  </div>
                );
              })()}

              {/* Card 3: Technical Games */}
              {(() => {
                const status = activityAvailability["Technical Games"] || "COMING SOON";
                return (
                  <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl flex flex-col justify-between space-y-4 hover:border-[#0078D4]/40 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Gamepad2 className="w-5 h-5" />
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
                        {status === "COMING SOON" && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            COMING SOON
                          </span>
                        )}
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
                      onClick={() => {
                        if (status === "CLOSED") {
                          setBlockedMessage("This activity is currently closed.");
                        } else if (status === "COMING SOON") {
                          setBlockedMessage("This activity is not available yet.");
                        } else {
                          setActiveTab("technical-games");
                        }
                      }}
                      variant="secondary"
                      size="md"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      View Technical Games
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
                    This assessment is currently closed by the administrator. Please check back later or explore other live MCC activities.
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
            ) : !verifiedStudent ? (
              <div className="p-12 text-center rounded-2xl bg-[#0D1B2A] border border-white/10 max-w-xl mx-auto space-y-5">
                <BriefcaseBusiness className="w-12 h-12 text-[#0078D4] mx-auto" />
                <div>
                  <h3 className="text-2xl font-bold text-[#F8FAFC]">Placement Questions Assessment</h3>
                  <p className="text-xs text-[#CBD5E1] mt-1">
                    {ACTIVE_PLACEMENT_SET.title} • {ACTIVE_PLACEMENT_SET.timerMinutes} Minutes
                  </p>
                </div>
                <Button
                  onClick={() => handleStartTestFlow("Placement Questions")}
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Verify Email & Start Test
                </Button>
              </div>
            ) : (
              <PlacementTestRunner
                username={verifiedStudent.username}
                email={verifiedStudent.email}
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
                    This quiz is currently closed by the administrator. Please check back later or explore other live MCC activities.
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
            ) : !verifiedStudent ? (
              <div className="p-12 text-center rounded-2xl bg-[#0D1B2A] border border-white/10 max-w-xl mx-auto space-y-5">
                <CircleHelp className="w-12 h-12 text-blue-400 mx-auto" />
                <div>
                  <h3 className="text-2xl font-bold text-[#F8FAFC]">General Quiz Trivia</h3>
                  <p className="text-xs text-[#CBD5E1] mt-1">
                    {ACTIVE_QUIZ_SET.title} • {ACTIVE_QUIZ_SET.timerMinutes} Minutes
                  </p>
                </div>
                <Button
                  onClick={() => handleStartTestFlow("General Quiz")}
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Verify Email & Start Quiz
                </Button>
              </div>
            ) : (
              <QuizTestRunner
                username={verifiedStudent.username}
                email={verifiedStudent.email}
                onFinishTest={handleTestFinished}
              />
            )}
          </div>
        )}

        {/* TAB 4: TECHNICAL GAMES */}
        {activeTab === "technical-games" && (
          <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
            {(activityAvailability["Technical Games"] || "COMING SOON") === "CLOSED" ? (
              <div className="p-12 text-center rounded-2xl bg-[#0D1B2A] border border-red-500/20 max-w-xl mx-auto space-y-5">
                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#F8FAFC]">Technical Games Closed</h3>
                  <p className="text-xs text-[#CBD5E1] mt-1.5 leading-relaxed">
                    This arena is currently closed by the administrator. Please check back later.
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
            ) : (
              <div className="p-8 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-4 text-center">
                <Gamepad2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-2xl font-bold text-[#F8FAFC]">Technical Games Arena</h3>
                <p className="text-xs text-[#CBD5E1] max-w-md mx-auto">
                  Explore published technical gaming rounds, speed debugging challenges, and IoT hacking arenas.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-4">
                  <div className="p-4 rounded-xl bg-[#07111F] border border-white/10 space-y-2">
                    <span className="text-xs font-bold text-[#22D3EE] block">Azure Speed Challenge</span>
                    <p className="text-xs text-[#94A3B8]">
                      Embedded micro-challenge round focused on Cloud API latency optimization.
                    </p>
                    <span className="inline-block px-2.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400">
                      Live Arena
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#07111F] border border-white/10 space-y-2">
                    <span className="text-xs font-bold text-amber-400 block">CTF Binary Exploitation</span>
                    <p className="text-xs text-[#94A3B8]">
                      Find vulnerabilities in compiled binaries and submit secret flag strings.
                    </p>
                    <span className="inline-block px-2.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400">
                      Upcoming Round
                    </span>
                  </div>
                </div>
              </div>
            )}
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
          <WeeklyLeaderboard isPublished={leaderboardPublished} />
        )}

        {/* TAB 8: MEMBERSHIP FORM */}
        {activeTab === "membership" && <MembershipForm />}
      </main>

      {/* Test Information & Rules Preview Modal */}
      {testInfoPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#22D3EE] block">
                  {targetTestType} Information
                </span>
                <h3 className="text-xl font-bold text-[#F8FAFC]">
                  {targetTestType === "Placement Questions"
                    ? ACTIVE_PLACEMENT_SET.title
                    : ACTIVE_QUIZ_SET.title}
                </h3>
              </div>
              <button
                onClick={() => setTestInfoPreviewOpen(false)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Config Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#07111F] border border-white/10 text-xs">
              <div>
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Questions</span>
                <span className="font-bold text-[#F8FAFC]">
                  {targetTestType === "Placement Questions" ? "4 Questions" : "3 Questions"}
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Duration</span>
                <span className="font-bold text-[#22D3EE]">
                  {targetTestType === "Placement Questions"
                    ? `${ACTIVE_PLACEMENT_SET.timerMinutes} Minutes`
                    : `${ACTIVE_QUIZ_SET.timerMinutes} Minutes`}
                </span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Random Questions</span>
                <span className="font-semibold text-emerald-400">Yes</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Random Choices</span>
                <span className="font-semibold text-emerald-400">Yes</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Attempts Allowed</span>
                <span className="font-semibold text-amber-400">1 Attempt</span>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Scoring</span>
                <span className="font-semibold text-[#CBD5E1]">Server Evaluated</span>
              </div>
            </div>

            {/* Rules / Instructions Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F8FAFC]">
                BEFORE YOU BEGIN
              </h4>
              <div className="p-4 rounded-xl bg-[#07111F] border border-white/10 text-xs text-[#CBD5E1] space-y-2 leading-relaxed">
                <p className="flex items-start gap-2">
                  <span className="text-[#0078D4] font-bold">•</span>
                  <span>Make sure you have a stable internet connection.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#0078D4] font-bold">•</span>
                  <span>The timer starts when you begin the assessment.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#0078D4] font-bold">•</span>
                  <span>You cannot restart the test once it has started.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#0078D4] font-bold">•</span>
                  <span>Your answers are automatically submitted when the test is completed or time expires.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>Leaving the secure test environment (fullscreen exit, tab switch) may be recorded as a security violation.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>Your final score and detailed report are calculated securely by the server.</span>
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
                  setOtpModalOpen(true);
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                I Understand & Proceed to Verification
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Student OTP Identity Modal */}
      <StudentOTPModal
        isOpen={otpModalOpen}
        testTitle={targetTestType === "Placement Questions" ? ACTIVE_PLACEMENT_SET.title : ACTIVE_QUIZ_SET.title}
        onClose={() => setOtpModalOpen(false)}
        onVerifiedSuccess={handleOtpVerified}
      />

      {/* Activity Availability Blocked Notice Modal */}
      {blockedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#F8FAFC]">Activity Unavailable</h3>
            <p className="text-sm text-[#CBD5E1] leading-relaxed">
              {blockedMessage}
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setBlockedMessage(null)}
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
      <StudentsCornerInner />
    </OBAuthProvider>
  );
}
