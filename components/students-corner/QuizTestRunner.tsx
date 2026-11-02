"use client";

import React, { useState, useEffect } from "react";
import {
  ACTIVE_QUIZ_SET,
  StudentResultReport,
  StudentInfo,
  getPublicQuizQuestions,
  evaluateQuizSubmission,
} from "@/lib/studentState";
import { Clock, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Download, HelpCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { QuestionText } from "../ui/QuestionText";

interface QuizTestRunnerProps {
  studentInfo?: StudentInfo;
  username?: string;
  email?: string;
  customQuestions?: { id: string; question: string; options: string[]; isCode?: boolean }[];
  timerMinutes?: number;
  testTitle?: string;
  onFinishTest: (report: StudentResultReport) => void;
}

export const QuizTestRunner: React.FC<QuizTestRunnerProps> = ({
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

  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const totalDuration = (timerMinutes || ACTIVE_QUIZ_SET.timerMinutes) * 60;
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(totalDuration);
  const [report, setReport] = useState<StudentResultReport | null>(null);

  const [skippedQuestions, setSkippedQuestions] = useState<string[]>([]);

  // Dynamically reflect questions array with useMemo (matching PlacementTestRunner)
  const questions = React.useMemo(() => {
    return customQuestions && Array.isArray(customQuestions) && customQuestions.length > 0
      ? customQuestions
      : getPublicQuizQuestions();
  }, [customQuestions]);

  // Timestamp-based elapsed timer to maintain accurate countdown across tab/window switches
  const startTimeRef = React.useRef<number | null>(null);
  const submittedRef = React.useRef(false);

  const handleSubmitQuiz = React.useCallback(async (isAutoSubmit = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    try {
      const res = await fetch("/api/students-corner/submit-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType: "General Quiz",
          studentInfo: effectiveStudentInfo,
          userAnswers,
          questionIds: questions.map((q) => q.id),
          skippedQuestionIds: skippedQuestions,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Quiz submission rejected: This event is currently closed or already attempted.");
        return;
      }

      const data = await res.json();
      const generatedReport =
        data.report ||
        evaluateQuizSubmission(
          effectiveStudentInfo,
          userAnswers,
          undefined,
          questions,
          skippedQuestions
        );
      setReport(generatedReport);
      onFinishTest(generatedReport);
    } catch (err) {
      console.error("Quiz submission network error:", err);
      const generatedReport = evaluateQuizSubmission(
        effectiveStudentInfo,
        userAnswers,
        undefined,
        questions,
        skippedQuestions
      );
      setReport(generatedReport);
      onFinishTest(generatedReport);
    }
  }, [effectiveStudentInfo, userAnswers, questions, skippedQuestions, onFinishTest]);

  useEffect(() => {
    if (report) return;
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    const updateTimer = () => {
      const start = startTimeRef.current || Date.now();
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = Math.max(0, totalDuration - elapsed);
      setTimeLeftSeconds(remaining);

      if (remaining <= 0 && !submittedRef.current) {
        handleSubmitQuiz(true);
      }
    };

    const timer = setInterval(updateTimer, 1000);

    const handleVisibilityOrFocus = () => {
      updateTimer();
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
    };
  }, [report, totalDuration, handleSubmitQuiz]);

  const handleSelectAnswer = (questionId: string, option: string) => {
    if (report) return;
    setSkippedQuestions((prev) => prev.filter((id) => id !== questionId));
    setUserAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSkipQuestion = (questionId: string) => {
    if (report) return;
    setUserAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
    setSkippedQuestions((prev) => (prev.includes(questionId) ? prev : [...prev, questionId]));
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const currentQ = questions[currentIdx] || questions[0];

  const isCurrentAnswered = currentQ ? userAnswers[currentQ.id] !== undefined && userAnswers[currentQ.id] !== "" : false;
  const isCurrentSkipped = currentQ ? skippedQuestions.includes(currentQ.id) : false;
  const canProceed = isCurrentAnswered || isCurrentSkipped;

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  const handleDownloadResultPDF = async () => {
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
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const safeName = (report.username || "student").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        a.download = `mcc-general-quiz-result-${safeName}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to download quiz result PDF.");
      }
    } catch (e) {
      console.error("Result PDF error:", e);
      alert("Network error while downloading result PDF.");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  if (report) {
    return (
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
        {/* Score Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-[#F8FAFC]">Quiz Completed!</h3>
            <p className="text-xs text-[#CBD5E1] mt-1">
              General Quiz results for <span className="font-semibold text-white">{report.username}</span> ({report.email})
            </p>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              {report.department || effectiveStudentInfo.department} • Year {report.year || effectiveStudentInfo.year}-{report.section || effectiveStudentInfo.section} • Roll: {report.rollNumber || effectiveStudentInfo.rollNumber}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="p-4 rounded-xl bg-[#07111F] border border-white/10">
              <span className="text-[10px] font-mono text-[#94A3B8] block">Score</span>
              <span className="text-2xl font-bold text-[#22D3EE]">{report.score}%</span>
            </div>
            <div className="p-4 rounded-xl bg-[#07111F] border border-white/10">
              <span className="text-[10px] font-mono text-[#94A3B8] block">Correct</span>
              <span className="text-2xl font-bold text-emerald-400">{report.correctAnswersCount}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#07111F] border border-white/10">
              <span className="text-[10px] font-mono text-[#94A3B8] block">Incorrect</span>
              <span className="text-2xl font-bold text-red-400">{report.incorrectAnswersCount}</span>
            </div>
          </div>
        </div>

        {/* Immediate Quiz Answer & Explanation Breakdown */}
        <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-6">
          <h4 className="text-base font-bold text-[#F8FAFC] pb-3 border-b border-white/10">
            Immediate Answer Key & Explanations
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
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-[#F8FAFC]">Q{idx + 1}.</span>
                      {item.isCode && (
                        <span className="px-1.5 py-0.5 rounded bg-[#0078D4]/20 text-[#22D3EE] font-mono text-[10px] font-bold">
                          Code
                        </span>
                      )}
                    </div>
                    <QuestionText
                      text={item.questionText}
                      isCode={Boolean(item.isCode)}
                      className="text-sm font-semibold text-[#F8FAFC]"
                    />
                  </div>
                  {item.isCorrect ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Correct</span>
                    </span>
                  ) : item.userAnswer === "Skipped (Don't Know)" ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center space-x-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Skipped (Don&apos;t Know)</span>
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
                    <span className="text-[#94A3B8] block text-[10px]">YOUR SELECTION</span>
                    <span className={item.isCorrect ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                      {item.userAnswer}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#07111F] border border-white/10">
                    <span className="text-[#94A3B8] block text-[10px]">CORRECT ANSWER</span>
                    <span className="text-emerald-400 font-semibold">{item.correctAnswer}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#07111F] border border-white/10 text-xs text-[#CBD5E1]">
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

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-[#0D1B2A] border border-white/10 flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 rounded-lg bg-[#0078D4]/20 border border-[#0078D4]/30 text-xs font-bold text-[#22D3EE] font-mono">
            Q {currentIdx + 1} / {questions.length}
          </span>
          <h3 className="text-sm font-bold text-[#F8FAFC] hidden sm:block">
            {testTitle || ACTIVE_QUIZ_SET.title}
          </h3>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#07111F] border border-white/10 text-amber-400 font-mono text-sm font-bold">
          <Clock className="w-4 h-4 animate-pulse" />
          <span>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-2xl space-y-6">
        <div className="space-y-3">
          {currentQ.isCode && (
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0078D4]/15 text-[#22D3EE] border border-[#0078D4]/30 font-mono">
              Coding Question
            </span>
          )}
          <QuestionText
            text={currentQ.question}
            isCode={Boolean(currentQ.isCode)}
            className="text-base sm:text-lg font-bold text-[#F8FAFC] leading-snug"
          />
        </div>

        {/* Options */}
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

        {/* Navigation */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <Button
            onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
            disabled={currentIdx === 0}
            variant="secondary"
            size="md"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSkipQuestion(currentQ.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border cursor-pointer select-none ${
                isCurrentSkipped
                  ? "bg-amber-500/25 border-amber-400 text-amber-200 shadow-md shadow-amber-500/20 ring-1 ring-amber-400/40"
                  : "bg-white/5 border-white/15 text-[#94A3B8] hover:border-amber-500/40 hover:text-amber-300 hover:bg-amber-500/10"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Don&apos;t Know – Just Pass</span>
              {isCurrentSkipped && <span className="text-amber-400 font-bold ml-0.5">✓</span>}
            </button>

            {currentIdx < questions.length - 1 ? (
              <Button
                onClick={() => {
                  if (canProceed) {
                    setCurrentIdx((i) => Math.min(questions.length - 1, i + 1));
                  }
                }}
                disabled={!canProceed}
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className={!canProceed ? "opacity-40 cursor-not-allowed" : ""}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (canProceed) {
                    handleSubmitQuiz();
                  }
                }}
                disabled={!canProceed}
                variant="primary"
                size="md"
                className={`bg-emerald-600 hover:bg-emerald-500 border-emerald-500 ${
                  !canProceed ? "opacity-40 cursor-not-allowed" : ""
                }`}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Submit Quiz
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
