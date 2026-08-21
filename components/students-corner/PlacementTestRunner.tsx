"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ACTIVE_PLACEMENT_SET,
  StudentResultReport,
  StudentInfo,
  getPublicPlacementQuestions,
  evaluatePlacementSubmission,
} from "@/lib/studentState";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  FileText,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Maximize2,
  Lock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "../ui/Button";

interface PlacementTestRunnerProps {
  studentInfo?: StudentInfo;
  username?: string;
  email?: string;
  customQuestions?: { id: string; question: string; options: string[] }[];
  timerMinutes?: number;
  testTitle?: string;
  onFinishTest: (report: StudentResultReport) => void;
}

const MAX_VIOLATIONS = 3;

export const PlacementTestRunner: React.FC<PlacementTestRunnerProps> = ({
  studentInfo,
  username,
  email,
  customQuestions,
  timerMinutes,
  testTitle,
  onFinishTest,
}) => {
  const effectiveStudentInfo: StudentInfo = studentInfo || {
    name: username || "Student",
    email: email || "",
    department: "Artificial Intelligence & Data Science",
    year: "1",
    section: "A",
    rollNumber: "N/A",
  };

  const candidateName = effectiveStudentInfo.name;
  const candidateEmail = effectiveStudentInfo.email;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(
    (timerMinutes || ACTIVE_PLACEMENT_SET.timerMinutes) * 60
  );
  const [report, setReport] = useState<StudentResultReport | null>(null);

  // Secure Test State & Violation Handling
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationsCount, setViolationsCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isTerminated, setIsTerminated] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const publicQuestions = (customQuestions && Array.isArray(customQuestions) && customQuestions.length > 0)
    ? customQuestions
    : getPublicPlacementQuestions();

  // Helper to record security violation
  const recordViolation = (type: string, message: string) => {
    setViolationsCount((prev) => {
      const nextCount = prev + 1;
      console.warn(`[SECURE TEST VIOLATION] ${type} (#${nextCount}): ${message}`);

      if (nextCount >= MAX_VIOLATIONS) {
        setIsTerminated(true);
        setWarningMessage(
          "SECURE TEST TERMINATED — The maximum number of secure-environment violations has been reached. Your test will now be submitted."
        );
      } else {
        setWarningMessage(message);
      }

      return nextCount;
    });
  };

  // Request Fullscreen helper
  const enterFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      setWarningMessage(null);
    } catch (err) {
      console.error("Fullscreen request failed:", err);
      setIsFullscreen(false);
    }
  };

  // Fullscreen, Visibility & Shortcut Event Listeners
  useEffect(() => {
    if (report || isTerminated) return;

    // Check initial fullscreen
    if (document.fullscreenElement) {
      setIsFullscreen(true);
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !report && !isTerminated) {
        setIsFullscreen(false);
        recordViolation("FULLSCREEN_EXIT", "Fullscreen mode has been exited. Please return to fullscreen to continue.");
      } else if (document.fullscreenElement) {
        setIsFullscreen(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible" && !report && !isTerminated) {
        recordViolation("TAB_HIDDEN", "You left the test window. This activity has been recorded.");
      }
    };

    const handleBlur = () => {
      if (!report && !isTerminated) {
        // Subtle focus loss monitoring
        recordViolation("WINDOW_BLUR", "Browser window lost focus. This activity has been recorded.");
      }
    };

    const handlePreventShortcuts = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        ["c", "v", "x", "a", "u", "s"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase()))) {
        e.preventDefault();
      }
    };

    const handlePreventCopy = (e: Event) => {
      e.preventDefault();
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Your test is in progress. Are you sure you want to leave?";
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("keydown", handlePreventShortcuts);
    document.addEventListener("contextmenu", handlePreventCopy);
    document.addEventListener("copy", handlePreventCopy);
    document.addEventListener("cut", handlePreventCopy);
    document.addEventListener("paste", handlePreventCopy);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("keydown", handlePreventShortcuts);
      document.removeEventListener("contextmenu", handlePreventCopy);
      document.removeEventListener("copy", handlePreventCopy);
      document.removeEventListener("cut", handlePreventCopy);
      document.removeEventListener("paste", handlePreventCopy);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [report, isTerminated]);

  // Main countdown timer (only runs when in fullscreen & active)
  useEffect(() => {
    if (report || !isFullscreen || isTerminated) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [report, isFullscreen, isTerminated]);

  // Submit handler
  const handleSubmitTest = async () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    try {
      const res = await fetch("/api/students-corner/submit-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType: "Placement Questions",
          studentInfo: effectiveStudentInfo,
          userAnswers,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Assessment submission rejected: This event is currently closed or already attempted.");
        return;
      }

      const data = await res.json();
      const generatedReport = data.report || evaluatePlacementSubmission(effectiveStudentInfo, userAnswers);
      setReport(generatedReport);
      onFinishTest(generatedReport);
    } catch (err) {
      console.error("Test submission network error:", err);
      // Fallback local evaluation only if network issue
      const generatedReport = evaluatePlacementSubmission(effectiveStudentInfo, userAnswers);
      setReport(generatedReport);
      onFinishTest(generatedReport);
    }
  };

  const handleSelectAnswer = (questionId: string, option: string) => {
    if (report || isTerminated) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Download Detailed Placement Report PDF
  const handleDownloadReport = async () => {
    if (!report) return;
    setIsDownloadingPDF(true);
    try {
      const res = await fetch("/api/students-corner/download-result-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: report.attemptId,
          email: report.email,
          report,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const safeStudent = (report.username || "student").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        link.download = `mcc-placement-result-${safeStudent}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      } else {
        alert("Failed to download placement result PDF.");
      }
    } catch (e) {
      console.error("Result PDF error:", e);
      alert("Network error while downloading result PDF.");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const questions = publicQuestions;
  const currentQ = questions[currentIdx];

  // REPORT VIEW: Test completed
  if (report) {
    return (
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
        {/* Report Overview Header */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-2xl space-y-6">
          <div className="pb-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#F8FAFC]">
                  Placement Evaluation Report
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Candidate: <strong className="text-white">{report.username}</strong> ({report.email}) • {report.department || effectiveStudentInfo.department} (Year {report.year || effectiveStudentInfo.year}-{report.section || effectiveStudentInfo.section}) • Roll: {report.rollNumber || effectiveStudentInfo.rollNumber}
                </p>
              </div>
            </div>

            <Button
              onClick={handleDownloadReport}
              disabled={isDownloadingPDF}
              variant="primary"
              size="md"
              leftIcon={<Download className="w-4 h-4" />}
            >
              {isDownloadingPDF ? "Generating PDF..." : "Download Result PDF"}
            </Button>
          </div>

          {/* Performance Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#07111F] border border-white/10 text-center">
              <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Overall Score</span>
              <span className="text-2xl font-bold text-[#22D3EE] block">{report.score} pts</span>
            </div>
            <div className="p-4 rounded-xl bg-[#07111F] border border-white/10 text-center">
              <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Percentage</span>
              <span className="text-2xl font-bold text-white block">{report.percentage}%</span>
            </div>
            <div className="p-4 rounded-xl bg-[#07111F] border border-white/10 text-center">
              <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Correct</span>
              <span className="text-2xl font-bold text-emerald-400 block">{report.correctAnswersCount}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#07111F] border border-white/10 text-center">
              <span className="text-[10px] font-mono uppercase text-[#94A3B8] block">Violations Recorded</span>
              <span className="text-2xl font-bold text-amber-400 block">{violationsCount}</span>
            </div>
          </div>
        </div>

        {/* Detailed Question Breakdown */}
        <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-6">
          <h4 className="text-base font-bold text-[#F8FAFC] pb-3 border-b border-white/10">
            Question-wise Analysis & Explanations
          </h4>

          <div className="space-y-4">
            {report.details.map((item, idx) => (
              <div
                key={item.questionId}
                className={`p-5 rounded-xl border ${
                  item.isCorrect
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-red-500/5 border-red-500/20"
                } space-y-3`}
              >
                <div className="flex items-start justify-between">
                  <h5 className="text-sm font-bold text-[#F8FAFC] flex items-center space-x-2">
                    <span>Q{idx + 1}. {item.questionText}</span>
                  </h5>
                  {item.isCorrect ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Correct</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center space-x-1">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Incorrect</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#07111F] border border-white/10">
                    <span className="text-[#94A3B8] block text-[10px]">YOUR ANSWER</span>
                    <span className={item.isCorrect ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                      {item.userAnswer}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#07111F] border border-white/10">
                    <span className="text-[#94A3B8] block text-[10px]">CORRECT ANSWER</span>
                    <span className="text-emerald-400 font-semibold">{item.correctAnswer}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#07111F] border border-white/10 text-xs text-[#CBD5E1] leading-relaxed">
                  <strong className="text-[#22D3EE] block mb-0.5">Explanation:</strong>
                  {item.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // INITIAL STATE: Fullscreen required before starting
  if (!isFullscreen) {
    return (
      <div className="p-8 sm:p-12 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-2xl max-w-xl mx-auto text-center space-y-6 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-[#0078D4]/20 border border-[#0078D4]/30 text-[#22D3EE] flex items-center justify-center mx-auto">
          <Maximize2 className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-2xl font-bold text-[#F8FAFC]">Fullscreen Required</h3>
          <p className="text-xs text-[#CBD5E1] mt-2 leading-relaxed">
            Fullscreen mode is required to start this secure assessment. The test timer will initialize once fullscreen mode is enabled.
          </p>
        </div>

        <Button
          onClick={enterFullscreen}
          variant="primary"
          size="lg"
          className="w-full justify-center"
          leftIcon={<Maximize2 className="w-4 h-4" />}
        >
          Enter Fullscreen & Start Test
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6 animate-fade-in max-w-3xl mx-auto select-none">
      {/* Header: Timer, Progress & Secure Status */}
      <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-white/10 flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 rounded-lg bg-[#0078D4]/20 border border-[#0078D4]/30 text-xs font-bold text-[#22D3EE] font-mono">
            Q {currentIdx + 1} of {questions.length}
          </span>
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400">
            <Lock className="w-3 h-3" />
            <span>Secure Test Mode</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {violationsCount > 0 && (
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              Violations: {violationsCount} / {MAX_VIOLATIONS}
            </span>
          )}

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#07111F] border border-white/10 text-amber-400 font-mono text-sm font-bold">
            <Clock className="w-4 h-4 animate-pulse" />
            <span>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* Security Warning Modal Overlay */}
      {warningMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0D1B2A] border border-amber-500/30 p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-[#F8FAFC]">
              {isTerminated ? "SECURE TEST TERMINATED" : "SECURE TEST WARNING"}
            </h3>

            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              {warningMessage}
            </p>

            <div className="p-3 rounded-xl bg-[#07111F] border border-white/10 text-xs text-[#94A3B8]">
              Recorded Violations: <strong className="text-amber-400">{violationsCount} / {MAX_VIOLATIONS}</strong>
            </div>

            <div className="pt-2">
              {isTerminated ? (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full bg-red-600 hover:bg-red-500 border-red-500"
                  onClick={handleSubmitTest}
                >
                  Submit Current Attempt
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={enterFullscreen}
                  leftIcon={<Maximize2 className="w-4 h-4" />}
                >
                  Return to Fullscreen & Test
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Question Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-2xl space-y-6">
        <h4 className="text-base sm:text-lg font-bold text-[#F8FAFC] leading-snug">
          {currentQ.question}
        </h4>

        {/* Options List */}
        <div className="space-y-3">
          {currentQ.options.map((opt) => {
            const isSelected = userAnswers[currentQ.id] === opt;
            return (
              <button
                key={opt}
                onClick={() => handleSelectAnswer(currentQ.id, opt)}
                className={`w-full p-4 rounded-xl text-left text-sm font-medium transition-all flex items-center justify-between border ${
                  isSelected
                    ? "bg-[#0078D4]/20 border-[#0078D4] text-[#0078D4] dark:text-white font-semibold shadow-md shadow-[#0078D4]/20"
                    : "bg-[#07111F] border-white/10 text-[#CBD5E1] hover:border-[#0078D4] dark:hover:border-white/25 hover:text-[#0078D4] dark:hover:text-white"
                }`}
              >
                <span>{opt}</span>
                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                    isSelected ? "border-[#0078D4] bg-[#0078D4] text-white" : "border-white/20"
                  }`}
                >
                  {isSelected ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {/* Navigation & Submit Buttons */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <Button
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            variant="secondary"
            size="md"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Previous
          </Button>

          {currentIdx < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
              variant="primary"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmitTest}
              variant="primary"
              size="md"
              className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
            >
              Submit Placement Test
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
