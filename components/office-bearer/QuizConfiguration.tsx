"use client";

import React, { useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Send, Clock, HelpCircle } from "lucide-react";
import { useOBAuth } from "./OBAuthProvider";
import { UnauthorizedGuard } from "./UnauthorizedGuard";
import { Button } from "../ui/Button";

interface QuizConfigurationProps {
  activityType: "General Quiz" | "Placement Questions";
}

export const QuizConfiguration: React.FC<QuizConfigurationProps> = ({
  activityType,
}) => {
  const { hasResponsibility, submitQuizProposal, submissions } = useOBAuth();

  // Check authorization permission
  const isAssigned = hasResponsibility(activityType);

  // Form Configuration State
  const [title, setTitle] = useState(
    activityType === "General Quiz"
      ? "Azure Cloud & AI Speed Challenge"
      : "Data Structures & Systems Placement Round 1"
  );
  const [questionsToUpload, setQuestionsToUpload] = useState<number>(20);
  const [questionsToDisplay, setQuestionsToDisplay] = useState<number>(15);
  const [randomQuestions, setRandomQuestions] = useState<boolean>(true);
  const [randomChoices, setRandomChoices] = useState<boolean>(false);
  const [timerMinutes, setTimerMinutes] = useState<number>(30);

  // CSV File & Validation State
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvQuestionsCount, setCsvQuestionsCount] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState<boolean>(false);

  // Submission Toast / Feedback
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  if (!isAssigned) {
    return <UnauthorizedGuard activityName={activityType} />;
  }

  // Simulated File Upload & CSV Parsing Validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidationError(null);
    setSubmitSuccess(false);

    if (!file.name.endsWith(".csv")) {
      setValidationError("Invalid file type. Please upload a valid CSV file (.csv).");
      setCsvFileName(null);
      setCsvQuestionsCount(null);
      setIsValidated(false);
      return;
    }

    // Read and parse CSV file
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim().length > 0);

      if (lines.length <= 1) {
        setValidationError("The uploaded CSV file is empty or missing header rows.");
        setIsValidated(false);
        return;
      }

      // Check Header
      const header = lines[0].toLowerCase();
      if (
        !header.includes("question") ||
        !header.includes("choice 1") ||
        !header.includes("choice 2") ||
        !header.includes("answer")
      ) {
        setValidationError(
          "CSV headers missing required columns. Must include: Question, Choice 1, Choice 2, Choice 3, Choice 4, Answer, Explanation."
        );
        setIsValidated(false);
        return;
      }

      const detectedCount = lines.length - 1;
      setCsvQuestionsCount(detectedCount);
      setCsvFileName(file.name);

      // Validate questions count vs specified upload count & display limit
      if (detectedCount !== questionsToUpload) {
        setValidationError(
          `CSV contains ${detectedCount} questions, but you specified ${questionsToUpload} questions to upload.`
        );
        setIsValidated(false);
      } else if (questionsToDisplay > questionsToUpload) {
        setValidationError(
          `Questions to display (${questionsToDisplay}) cannot exceed total uploaded questions (${questionsToUpload}).`
        );
        setIsValidated(false);
      } else {
        setValidationError(null);
        setIsValidated(true);
      }
    };

    reader.readAsText(file);
  };

  // Preset sample CSV loader for easy testing
  const handleLoadSampleCSV = () => {
    setValidationError(null);
    const sampleCount = questionsToUpload;
    setCsvQuestionsCount(sampleCount);
    setCsvFileName(`${activityType.toLowerCase().replace(" ", "_")}_sample.csv`);
    setIsValidated(true);
  };

  const handleSubmitForApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidated || !csvFileName || !csvQuestionsCount) {
      setValidationError("Please upload and validate a valid CSV file before submitting.");
      return;
    }

    submitQuizProposal({
      type: activityType,
      title: title || `${activityType} Submission`,
      questionsToUpload,
      questionsToDisplay,
      randomQuestions,
      randomChoices,
      timerMinutes,
      questionsDetected: csvQuestionsCount,
      csvFileName,
    });

    setSubmitSuccess(true);
  };

  // Filter recent submissions for this activity
  const relevantSubmissions = submissions.filter((s) => s.type === activityType);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {submitSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center space-x-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div>
            <span className="font-bold block">Submitted for Approval!</span>
            <span className="text-xs text-emerald-300">
              Your {activityType} configuration and CSV set have been routed to the Admin Approval Queue (Status: Pending Approval).
            </span>
          </div>
        </div>
      )}

      {/* Main Form & Upload Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Configuration & CSV Upload */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmitForApproval} className="space-y-6">
            {/* Step 1: Configuration Form */}
            <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-5">
              <div className="pb-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#F8FAFC]">
                  1. {activityType} Configuration
                </h3>
                <span className="text-xs font-mono text-[#22D3EE]">
                  PARAMETER SETTINGS
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Challenge Title / Set Name
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Azure & Cloud Speed Round 1"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#0078D4]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                    Questions to Upload
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={questionsToUpload}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuestionsToUpload(val);
                      if (csvQuestionsCount && csvQuestionsCount !== val) {
                        setValidationError(
                          `CSV contains ${csvQuestionsCount} questions, but you specified ${val} questions to upload.`
                        );
                        setIsValidated(false);
                      } else if (csvQuestionsCount === val) {
                        setValidationError(null);
                        setIsValidated(true);
                      }
                    }}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                    Questions to Display per Student
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={questionsToUpload}
                    value={questionsToDisplay}
                    onChange={(e) => setQuestionsToDisplay(parseInt(e.target.value) || 1)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                    Random Questions
                  </label>
                  <select
                    value={randomQuestions ? "Yes" : "No"}
                    onChange={(e) => setRandomQuestions(e.target.value === "Yes")}
                    className="w-full h-11 px-3 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
                  >
                    <option value="Yes">Yes (Randomized)</option>
                    <option value="No">No (Sequential)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                    Random Choices
                  </label>
                  <select
                    value={randomChoices ? "Yes" : "No"}
                    onChange={(e) => setRandomChoices(e.target.value === "Yes")}
                    className="w-full h-11 px-3 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
                  >
                    <option value="Yes">Yes (Shuffle Options)</option>
                    <option value="No">No (Fixed Order)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                    Timer Limit
                  </label>
                  <select
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(parseInt(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Questions CSV Uploader Area */}
            <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-4">
              <div className="pb-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#F8FAFC]">
                  2. Questions CSV Uploader
                </h3>
                <button
                  type="button"
                  onClick={handleLoadSampleCSV}
                  className="text-xs text-[#0078D4] hover:underline font-medium"
                >
                  + Generate Valid Sample CSV
                </button>
              </div>

              {/* Upload Drop Area */}
              <div className="relative border-2 border-dashed border-white/20 hover:border-[#0078D4] rounded-2xl p-8 text-center transition-all bg-[#07111F]/50 group">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="space-y-3 pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-[#0078D4]/10 border border-[#0078D4]/30 flex items-center justify-center mx-auto text-[#0078D4] group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#F8FAFC]">
                      Questions CSV
                    </h4>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Drag & drop your CSV file here or click to browse
                    </p>
                  </div>
                  <div className="inline-block px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-[#CBD5E1]">
                    Required Columns: Question, Choice 1, Choice 2, Choice 3, Choice 4, Answer, Explanation
                  </div>
                </div>
              </div>

              {/* CSV Validation Feedback */}
              {validationError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {isValidated && csvFileName && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold">
                      Validated File: {csvFileName} ({csvQuestionsCount} questions detected)
                    </span>
                  </div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-300">
                    Ready for Approval
                  </span>
                </div>
              )}
            </div>

            {/* Step 3: Submit Button */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!isValidated}
                leftIcon={<Send className="w-4 h-4" />}
                className={!isValidated ? "opacity-50 cursor-not-allowed" : ""}
              >
                Submit for Approval
              </Button>
            </div>
          </form>
        </div>

        {/* Right 1 Column: Concise Preview & Submissions Status */}
        <div className="space-y-6">
          {/* Concise Preview Panel */}
          <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-4">
            <div className="pb-3 border-b border-white/10 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-[#22D3EE]" />
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Submission Preview
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-[#94A3B8]">Questions Detected:</span>
                <span className="font-semibold font-mono text-[#F8FAFC]">
                  {csvQuestionsCount !== null ? `${csvQuestionsCount} questions` : "—"}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-[#94A3B8]">Questions to Display:</span>
                <span className="font-semibold font-mono text-[#F8FAFC]">
                  {questionsToDisplay} questions
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-[#94A3B8]">Random Questions:</span>
                <span className="font-semibold text-[#F8FAFC]">
                  {randomQuestions ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-[#94A3B8]">Random Choices:</span>
                <span className="font-semibold text-[#F8FAFC]">
                  {randomChoices ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-[#94A3B8]">Timer Duration:</span>
                <span className="font-semibold text-[#22D3EE] font-mono">
                  {timerMinutes} minutes
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#07111F] border border-white/10 text-[11px] text-[#94A3B8] leading-relaxed">
              Upon clicking <strong className="text-white">Submit for Approval</strong>, this proposal will be routed to the Admin Approval Queue. Content remains unposted until Admin approval.
            </div>
          </div>

          {/* Submissions Status List */}
          <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-4">
            <div className="pb-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Submission Status
              </h3>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>

            <div className="space-y-3">
              {relevantSubmissions.length === 0 ? (
                <p className="text-xs text-[#94A3B8] italic py-2">
                  No submissions yet for {activityType}.
                </p>
              ) : (
                relevantSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl bg-[#07111F] border border-white/10 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#F8FAFC] truncate">
                        {sub.title}
                      </span>
                      {sub.status === "Pending Approval" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Pending Approval
                        </span>
                      )}
                      {sub.status === "Approved" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Approved
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-mono">
                      <span>{sub.csvFileName}</span>
                      <span>{sub.submittedDate}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
