"use client";

import React, { useState, useEffect } from "react";
import {
  ACTIVE_QUIZ_SET,
  StudentResultReport,
  StudentInfo,
  getPublicQuizQuestions,
  evaluateQuizSubmission,
} from "@/lib/studentState";
import { Clock, CheckCircle2, XCircle, ArrowRight, ArrowLeft, Download } from "lucide-react";
import { Button } from "../ui/Button";

interface QuizTestRunnerProps {
  studentInfo?: StudentInfo;
  username?: string;
  email?: string;
  onFinishTest: (report: StudentResultReport) => void;
}

export const QuizTestRunner: React.FC<QuizTestRunnerProps> = ({
  studentInfo,
  username,
  email,
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
  const totalDuration = ACTIVE_QUIZ_SET.timerMinutes * 60;
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(totalDuration);
  const [report, setReport] = useState<StudentResultReport | null>(null);

  // Stabilize questions array so ordering and choices never regenerate on re-renders
  const [questions] = useState(() => getPublicQuizQuestions());

  // Timestamp-based elapsed timer to maintain accurate countdown across tab/window switches
  const startTimeRef = React.useRef<number>(Date.now());
  const submittedRef = React.useRef(false);

  const handleSubmitQuiz = React.useCallback(async () => {
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
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Quiz submission rejected: This event is currently closed or already attempted.");
        return;
      }

      const data = await res.json();
      const generatedReport = data.report || evaluateQuizSubmission(effectiveStudentInfo, userAnswers);
      setReport(generatedReport);
      onFinishTest(generatedReport);
    } catch (err) {
      console.error("Quiz submission network error:", err);
      const generatedReport = evaluateQuizSubmission(effectiveStudentInfo, userAnswers);
      setReport(generatedReport);
      onFinishTest(generatedReport);
    }
  }, [effectiveStudentInfo, userAnswers, onFinishTest]);

  useEffect(() => {
    if (report) return;

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, totalDuration - elapsed);
      setTimeLeftSeconds(remaining);

      if (remaining <= 0 && !submittedRef.current) {
        handleSubmitQuiz();
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
    setUserAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const currentQ = questions[currentIdx];

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

          <div className="pt-2 flex justify-center">
            <Button
              onClick={handleDownloadResultPDF}
              disabled={isDownloadingPDF}
              variant="primary"
              size="md"
              leftIcon={<Download className="w-4 h-4" />}
              className="bg-[#0078D4] hover:bg-[#0078D4]/80"
            >
              {isDownloadingPDF ? "Generating PDF..." : "Download Result PDF"}
            </Button>
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
                <div className="flex items-start justify-between">
                  <h5 className="text-sm font-bold text-[#F8FAFC]">
                    Q{idx + 1}. {item.questionText}
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
            {ACTIVE_QUIZ_SET.title}
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
        <h4 className="text-base sm:text-lg font-bold text-[#F8FAFC] leading-snug">
          {currentQ.question}
        </h4>

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
                    ? "bg-[#0078D4]/20 border-[#0078D4] text-white shadow-md shadow-[#0078D4]/20"
                    : "bg-[#07111F] border-white/10 text-[#CBD5E1] hover:border-white/25 hover:text-white"
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
              onClick={handleSubmitQuiz}
              variant="primary"
              size="md"
              className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
            >
              Submit Quiz
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
