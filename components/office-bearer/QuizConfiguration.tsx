"use client";

import React, { useState, useEffect } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Send, Clock, Calendar, ArrowRight, RefreshCw, X, Plus, Trash2, Edit3, Loader2, Save, Database, Layers } from "lucide-react";
import { useOBAuth } from "./OBAuthProvider";
import { UnauthorizedGuard } from "./UnauthorizedGuard";
import { Button } from "../ui/Button";
import { LeaderboardPublishCard } from "./LeaderboardPublishCard";

interface QuizConfigurationProps {
  activityType: "General Quiz" | "Placement Questions";
}

export const QuizConfiguration: React.FC<QuizConfigurationProps> = ({
  activityType,
}) => {
  const { hasResponsibility, submitQuizProposal, submissions, extendDeadline, currentOb, refreshProposals } = useOBAuth();

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

  // Timeline / Schedule State (Default: starts today at 10:00, ends tomorrow at 17:00)
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [startTime, setStartTime] = useState<string>("10:00");
  const [endDate, setEndDate] = useState<string>(tomorrowStr);
  const [endTime, setEndTime] = useState<string>("17:00");

  // CSV File & Validation State
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvQuestionsCount, setCsvQuestionsCount] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState<boolean>(false);

  // Submission / Save Toast Feedback
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Question CRUD Modal State
  const [questionModalOpen, setQuestionModalOpen] = useState<boolean>(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [modalQuestionText, setModalQuestionText] = useState<string>("");
  const [modalOption1, setModalOption1] = useState<string>("");
  const [modalOption2, setModalOption2] = useState<string>("");
  const [modalOption3, setModalOption3] = useState<string>("");
  const [modalOption4, setModalOption4] = useState<string>("");
  const [modalCorrectAnswer, setModalCorrectAnswer] = useState<string>("");
  const [modalExplanation, setModalExplanation] = useState<string>("");

  // Deadline Extension Modal State
  const [extendingSubmission, setExtendingSubmission] = useState<any | null>(null);
  const [extEndDate, setExtEndDate] = useState<string>("");
  const [extEndTime, setExtEndTime] = useState<string>("");
  const [isExtending, setIsExtending] = useState<boolean>(false);
  const [extSuccess, setExtSuccess] = useState<boolean>(false);

  // Structured questions configured / uploaded
  const [uploadedQuestions, setUploadedQuestions] = useState<any[]>([]);

  // Load persistent configuration from MongoDB on mount
  useEffect(() => {
    const loadFromDb = async () => {
      setIsLoadingDb(true);
      try {
        const res = await fetch(`/api/office-bearer/activities/manage?type=${encodeURIComponent(activityType)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.proposal) {
            const p = data.proposal;
            if (p.title) setTitle(p.title);
            if (p.timerMinutes) setTimerMinutes(p.timerMinutes);
            if (p.randomQuestions !== undefined) setRandomQuestions(p.randomQuestions);
            if (p.randomChoices !== undefined) setRandomChoices(p.randomChoices);
            if (p.startAt) {
              const d = new Date(p.startAt);
              setStartDate(d.toISOString().split("T")[0]);
              setStartTime(d.toTimeString().substring(0, 5));
            }
            if (p.endAt) {
              const d = new Date(p.endAt);
              setEndDate(d.toISOString().split("T")[0]);
              setEndTime(d.toTimeString().substring(0, 5));
            }
            if (Array.isArray(p.questions) && p.questions.length > 0) {
              setUploadedQuestions(p.questions);
              setCsvQuestionsCount(p.questions.length);
              setQuestionsToUpload(p.questionsToUpload || p.questions.length);
              setQuestionsToDisplay(p.questionsToDisplay || p.questions.length);
              setCsvFileName(p.csvFileName || `${activityType.toLowerCase().replace(" ", "_")}_active.csv`);
              setIsValidated(true);
            } else {
              setQuestionsToUpload(p.questionsToUpload || (activityType === "Placement Questions" ? 4 : 3));
              setQuestionsToDisplay(p.questionsToDisplay || (activityType === "Placement Questions" ? 4 : 3));
            }
          }
        }
      } catch (e) {
        console.error("Failed to load activity from DB:", e);
      } finally {
        setIsLoadingDb(false);
      }
    };

    loadFromDb();
  }, [activityType]);

  if (!isAssigned) {
    return <UnauthorizedGuard activityName={activityType} />;
  }

  // CSV Row Parser helper handling quotes and commas
  const parseCSVRow = (text: string): string[] => {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === "," && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

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
      setUploadedQuestions([]);
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

      // Parse structured questions from all data rows
      const parsedList: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseCSVRow(line);
        if (cols.length >= 6) {
          const qText = cols[0];
          const choice1 = cols[1];
          const choice2 = cols[2];
          const choice3 = cols[3] || "N/A";
          const choice4 = cols[4] || "N/A";
          const answer = cols[5] || choice1;
          const explanation = cols[6] || `Standard technical assessment explanation for question ${parsedList.length + 1}.`;
          parsedList.push({
            id: `q${parsedList.length + 1}`,
            question: qText,
            options: [choice1, choice2, choice3, choice4],
            correctAnswer: answer,
            explanation,
          });
        }
      }

      const detectedCount = parsedList.length || (lines.length - 1);
      setCsvQuestionsCount(detectedCount);
      setCsvFileName(file.name);
      setUploadedQuestions(parsedList);

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
    const sampleCount = questionsToUpload || 6;
    const sampleQuestions: any[] = [];
    for (let i = 1; i <= sampleCount; i++) {
      sampleQuestions.push({
        id: `q${i}`,
        question: `Sample Technical Question #${i}: Core Assessment Assessment Topic ${i}?`,
        options: [
          `Option A for Question ${i}`,
          `Option B for Question ${i} (Correct)`,
          `Option C for Question ${i}`,
          `Option D for Question ${i}`,
        ],
        correctAnswer: `Option B for Question ${i} (Correct)`,
        explanation: `Detailed explanation and technical rationale for Question #${i}.`,
      });
    }
    setUploadedQuestions(sampleQuestions);
    setCsvQuestionsCount(sampleCount);
    setCsvFileName(`${activityType.toLowerCase().replace(" ", "_")}_sample.csv`);
    setIsValidated(true);
  };

  const validateTimeline = () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      return "Start date, start time, end date, and end time are all required.";
    }
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return "Invalid date or time format.";
    }
    if (end.getTime() <= start.getTime()) {
      return "End Date & Time must be strictly after Start Date & Time.";
    }
    return null;
  };

  // Question CRUD Handlers
  const handleOpenAddQuestion = () => {
    setEditingQuestionIndex(null);
    setModalQuestionText("");
    setModalOption1("");
    setModalOption2("");
    setModalOption3("");
    setModalOption4("");
    setModalCorrectAnswer("");
    setModalExplanation("");
    setQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (idx: number) => {
    const q = uploadedQuestions[idx];
    if (!q) return;
    setEditingQuestionIndex(idx);
    setModalQuestionText(q.question || "");
    const opts = q.options || [];
    setModalOption1(opts[0] || "");
    setModalOption2(opts[1] || "");
    setModalOption3(opts[2] || "");
    setModalOption4(opts[3] || "");
    setModalCorrectAnswer(q.correctAnswer || opts[0] || "");
    setModalExplanation(q.explanation || "");
    setQuestionModalOpen(true);
  };

  const handleDeleteQuestion = (idx: number) => {
    const nextList = uploadedQuestions.filter((_, i) => i !== idx);
    setUploadedQuestions(nextList);
    setCsvQuestionsCount(nextList.length);
    setQuestionsToUpload(nextList.length);
    if (questionsToDisplay > nextList.length) {
      setQuestionsToDisplay(nextList.length);
    }
    setIsValidated(nextList.length > 0);
  };

  const handleSaveModalQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalQuestionText.trim() || !modalOption1.trim() || !modalOption2.trim()) {
      alert("Question and at least Choice 1 & Choice 2 are required.");
      return;
    }
    const opts = [
      modalOption1.trim(),
      modalOption2.trim(),
      modalOption3.trim() || "N/A",
      modalOption4.trim() || "N/A",
    ];
    const correct = modalCorrectAnswer.trim() || opts[0];
    const explanation = modalExplanation.trim() || `Technical rationale for question.`;

    let nextList: any[] = [];
    if (editingQuestionIndex !== null && editingQuestionIndex >= 0) {
      nextList = [...uploadedQuestions];
      nextList[editingQuestionIndex] = {
        ...nextList[editingQuestionIndex],
        question: modalQuestionText.trim(),
        options: opts,
        correctAnswer: correct,
        explanation,
      };
    } else {
      const newQ = {
        id: `q${uploadedQuestions.length + 1}`,
        question: modalQuestionText.trim(),
        options: opts,
        correctAnswer: correct,
        explanation,
      };
      nextList = [...uploadedQuestions, newQ];
    }

    setUploadedQuestions(nextList);
    setCsvQuestionsCount(nextList.length);
    setQuestionsToUpload(nextList.length);
    if (questionsToDisplay > nextList.length) {
      setQuestionsToDisplay(nextList.length);
    }
    setIsValidated(true);
    setValidationError(null);
    setQuestionModalOpen(false);
  };

  const handleSubmitForApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedQuestions.length === 0) {
      setValidationError("Please configure or upload at least 1 question before submitting.");
      return;
    }

    const timelineErr = validateTimeline();
    if (timelineErr) {
      setValidationError(timelineErr);
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${endDate}T${endTime}`);

    setIsSaving(true);
    setValidationError(null);

    try {
      // 1. Direct MongoDB persistence and activation
      const res = await fetch("/api/office-bearer/activities/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activityType,
          title: title || `${activityType} Assessment`,
          submittedBy: currentOb.name,
          authorDepartment: currentOb.department,
          questions: uploadedQuestions,
          questionsToUpload,
          questionsToDisplay,
          randomQuestions,
          randomChoices,
          timerMinutes,
          questionsDetected: uploadedQuestions.length,
          csvFileName: csvFileName || `${activityType.toLowerCase().replace(" ", "_")}_active.csv`,
          startAt: startDateTime.toISOString(),
          endAt: endDateTime.toISOString(),
          publishImmediately: true,
        }),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setSaveMessage(`${activityType} configuration and all ${uploadedQuestions.length} questions persistently saved and activated in MongoDB!`);
        if (refreshProposals) refreshProposals();
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        const err = await res.json().catch(() => ({}));
        setValidationError(err.message || "Failed to persist to database.");
      }

      // 2. Also register in local/shared OB context submissions
      submitQuizProposal({
        type: activityType,
        title: title || `${activityType} Submission`,
        questions: uploadedQuestions,
        questionsToUpload,
        questionsToDisplay,
        randomQuestions,
        randomChoices,
        timerMinutes,
        questionsDetected: uploadedQuestions.length,
        csvFileName: csvFileName || `${activityType.toLowerCase().replace(" ", "_")}_active.csv`,
        startAt: startDateTime.toISOString(),
        endAt: endDateTime.toISOString(),
      });
    } catch (e: any) {
      console.error("Save error:", e);
      setValidationError("Network error saving configuration to database.");
    } finally {
      setIsSaving(false);
    }
  };

  // Open timeline extension modal
  const handleOpenExtend = (sub: any) => {
    setExtendingSubmission(sub);
    setExtSuccess(false);
    if (sub.endAt) {
      const d = new Date(sub.endAt);
      setExtEndDate(d.toISOString().split("T")[0]);
      setExtEndTime(d.toTimeString().substring(0, 5));
    } else {
      setExtEndDate(tomorrowStr);
      setExtEndTime("18:00");
    }
  };

  // Handle saving deadline extension
  const handleSaveExtension = async () => {
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

  // Filter recent submissions for this activity
  const relevantSubmissions = submissions.filter((s) => s.type === activityType);

  const formatDisplayDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {submitSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center space-x-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div>
            <span className="font-bold block">Submitted for Approval!</span>
            <span className="text-xs text-emerald-300">
              Your {activityType} configuration, schedule, and CSV set have been routed to the Admin Approval Queue (Status: Pending Approval).
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

              {/* Step 1.1: Activity Schedule / Timeline Settings */}
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-[#22D3EE]" />
                    <h4 className="text-sm font-bold text-[#F8FAFC]">
                      Activity Schedule & Automatic Timeline
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-[#94A3B8] uppercase">
                    MongoDB Persisted
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Start Date & Time */}
                  <div className="p-3.5 rounded-xl bg-[#07111F] border border-white/10 space-y-2.5">
                    <span className="text-xs font-semibold text-[#22D3EE] block">
                      Starting Date & Time (Opens at)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono text-[#94A3B8] mb-1">Date</label>
                        <input
                          type="date"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg bg-[#0D1B2A] border border-white/15 text-[#F8FAFC] text-xs focus:outline-none focus:border-[#0078D4]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#94A3B8] mb-1">Time</label>
                        <input
                          type="time"
                          required
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg bg-[#0D1B2A] border border-white/15 text-[#F8FAFC] text-xs focus:outline-none focus:border-[#0078D4]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* End Date & Time */}
                  <div className="p-3.5 rounded-xl bg-[#07111F] border border-white/10 space-y-2.5">
                    <span className="text-xs font-semibold text-red-400 block">
                      Ending Date & Time (Closes at)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-mono text-[#94A3B8] mb-1">Date</label>
                        <input
                          type="date"
                          required
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg bg-[#0D1B2A] border border-white/15 text-[#F8FAFC] text-xs focus:outline-none focus:border-[#0078D4]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-[#94A3B8] mb-1">Time</label>
                        <input
                          type="time"
                          required
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg bg-[#0D1B2A] border border-white/15 text-[#F8FAFC] text-xs focus:outline-none focus:border-[#0078D4]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Students Corner automatically transitions from <strong className="text-amber-300">Upcoming</strong> → <strong className="text-emerald-300">Open</strong> → <strong className="text-red-300">Closed</strong> based on server time. You can extend the deadline later without requiring Admin re-approval.
                </p>
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

            {/* Step 3: Configured Questions List (Full CRUD) */}
            <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-4">
              <div className="pb-3 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#22D3EE]" />
                    <span>3. Configured Question Pool ({uploadedQuestions.length} Questions)</span>
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    View, edit, or add questions. Students will receive {questionsToDisplay} questions from this pool.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOpenAddQuestion}
                  leftIcon={<Plus className="w-4 h-4 text-[#22D3EE]" />}
                  className="self-start sm:self-auto border-[#0078D4]/40 hover:border-[#0078D4]"
                >
                  Add Question
                </Button>
              </div>

              {isLoadingDb ? (
                <div className="py-8 text-center text-xs text-[#94A3B8] flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#0078D4]" />
                  <span>Loading questions from database...</span>
                </div>
              ) : uploadedQuestions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#94A3B8] border border-dashed border-white/10 rounded-xl p-4">
                  No questions configured yet. Upload a CSV file above or click <strong>Add Question</strong> to create questions manually.
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {uploadedQuestions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-4 rounded-xl bg-[#07111F] border border-white/10 space-y-2.5 text-xs hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="px-2 py-0.5 rounded bg-[#0078D4]/20 text-[#22D3EE] font-mono font-bold text-[11px] flex-shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-[#F8FAFC] leading-snug">
                            {q.question}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditQuestion(idx)}
                            className="p-1.5 rounded-lg text-[#CBD5E1] hover:text-[#22D3EE] hover:bg-white/5 transition-colors"
                            title="Edit Question"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(idx)}
                            className="p-1.5 rounded-lg text-[#CBD5E1] hover:text-red-400 hover:bg-white/5 transition-colors"
                            title="Delete Question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 pl-7">
                        {(q.options || []).map((opt: string, oIdx: number) => {
                          const isCorrect = opt === q.correctAnswer;
                          return (
                            <div
                              key={oIdx}
                              className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${
                                isCorrect
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold"
                                  : "bg-white/[0.02] border-white/5 text-[#94A3B8]"
                              }`}
                            >
                              <span>
                                <strong className="text-white/60 mr-1.5 font-mono">
                                  {String.fromCharCode(65 + oIdx)}.
                                </strong>
                                {opt}
                              </span>
                              {isCorrect && (
                                <span className="text-[10px] font-mono text-emerald-400 font-bold ml-1">
                                  ✓ Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="text-[11px] text-[#94A3B8] pl-7 pt-1 border-t border-white/5">
                          <strong className="text-[#22D3EE] mr-1 font-mono">Rationale:</strong>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Save Message Feedback */}
            {saveMessage && (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{saveMessage}</span>
              </div>
            )}

            {/* Step 4: Persistent Save & Publish Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-[#94A3B8] flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>Directly persists to MongoDB mcc_database proposals</span>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSaving || uploadedQuestions.length === 0}
                leftIcon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                {isSaving ? "Saving to MongoDB..." : "Save & Activate in Database"}
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

              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-[#94A3B8]">Timer Duration:</span>
                <span className="font-semibold text-[#22D3EE] font-mono">
                  {timerMinutes} minutes
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-[#94A3B8]">Start Schedule:</span>
                <span className="font-semibold text-[#22D3EE] font-mono">
                  {startDate} {startTime}
                </span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-[#94A3B8]">End Schedule:</span>
                <span className="font-semibold text-red-400 font-mono">
                  {endDate} {endTime}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#07111F] border border-white/10 text-[11px] text-[#94A3B8] leading-relaxed">
              Upon clicking <strong className="text-white">Submit for Approval</strong>, this proposal will be routed to the Admin Approval Queue. Content remains unposted until Admin approval.
            </div>
          </div>

          {/* Leaderboard Publication Control (Strictly Placement Questions Only) */}
          {activityType === "Placement Questions" && (
            <LeaderboardPublishCard
              role="OFFICE_BEARER"
              assignedResponsibility={activityType}
              activityType={activityType}
            />
          )}

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
                    className="p-3 rounded-xl bg-[#07111F] border border-white/10 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#F8FAFC] truncate">
                        {sub.title}
                        {(sub.revisionNumber || 0) > 0 && (
                          <span className="ml-1.5 text-purple-400 text-[10px] font-mono">(Rev #{sub.revisionNumber})</span>
                        )}
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
                      {sub.status === "Pending Re-Approval" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          Re-Approval
                        </span>
                      )}
                      {sub.status === "Rejected" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          Rejected
                        </span>
                      )}
                      {sub.status === "Archived" && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                          Archived
                        </span>
                      )}
                    </div>

                    {/* Timeline Info Display */}
                    {(sub.startAt || sub.endAt) && (
                      <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5 space-y-0.5 text-[11px] font-mono text-[#94A3B8]">
                        {sub.startAt && <div>Starts: <span className="text-[#22D3EE]">{formatDisplayDateTime(sub.startAt)}</span></div>}
                        {sub.endAt && <div>Ends: <span className="text-red-400">{formatDisplayDateTime(sub.endAt)}</span></div>}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-mono">
                      <span>{sub.csvFileName}</span>
                      <span>{sub.submittedDate}</span>
                    </div>

                    {/* Extend Deadline Quick Action for Approved submissions */}
                    {sub.status === "Approved" && (
                      <div className="pt-1.5 border-t border-white/5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleOpenExtend(sub)}
                          className="text-[11px] font-semibold text-[#22D3EE] hover:underline flex items-center space-x-1"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Extend Deadline</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Extend Deadline Modal */}
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
                    onClick={handleSaveExtension}
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

      {/* Question Add / Edit Modal */}
      {questionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-[#22D3EE]" />
                <h3 className="text-base font-bold text-[#F8FAFC]">
                  {editingQuestionIndex !== null ? `Edit Question #${editingQuestionIndex + 1}` : "Add New Question"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuestionModalOpen(false)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalQuestion} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">
                  Question Text <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={modalQuestionText}
                  onChange={(e) => setModalQuestionText(e.target.value)}
                  placeholder="Enter the complete question prompt..."
                  className="w-full p-2.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-xs focus:outline-none focus:border-[#0078D4]"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[#CBD5E1] font-semibold">
                  Multiple Choice Options <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-[#22D3EE] w-6 text-center">A.</span>
                    <input
                      type="text"
                      required
                      value={modalOption1}
                      onChange={(e) => setModalOption1(e.target.value)}
                      placeholder="Choice 1..."
                      className="flex-1 h-9 px-2.5 rounded-lg bg-[#07111F] border border-white/15 text-[#F8FAFC] text-xs focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-[#22D3EE] w-6 text-center">B.</span>
                    <input
                      type="text"
                      required
                      value={modalOption2}
                      onChange={(e) => setModalOption2(e.target.value)}
                      placeholder="Choice 2..."
                      className="flex-1 h-9 px-2.5 rounded-lg bg-[#07111F] border border-white/15 text-[#F8FAFC] text-xs focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-[#22D3EE] w-6 text-center">C.</span>
                    <input
                      type="text"
                      value={modalOption3}
                      onChange={(e) => setModalOption3(e.target.value)}
                      placeholder="Choice 3 (optional)..."
                      className="flex-1 h-9 px-2.5 rounded-lg bg-[#07111F] border border-white/15 text-[#F8FAFC] text-xs focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-[#22D3EE] w-6 text-center">D.</span>
                    <input
                      type="text"
                      value={modalOption4}
                      onChange={(e) => setModalOption4(e.target.value)}
                      placeholder="Choice 4 (optional)..."
                      className="flex-1 h-9 px-2.5 rounded-lg bg-[#07111F] border border-white/15 text-[#F8FAFC] text-xs focus:outline-none focus:border-[#0078D4]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">
                  Correct Answer <span className="text-red-400">*</span>
                </label>
                <select
                  value={modalCorrectAnswer || modalOption1}
                  onChange={(e) => setModalCorrectAnswer(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-[#07111F] border border-white/15 text-emerald-400 text-xs focus:outline-none focus:border-[#0078D4]"
                >
                  <option value={modalOption1}>{modalOption1 ? `A: ${modalOption1}` : "Choice A"}</option>
                  <option value={modalOption2}>{modalOption2 ? `B: ${modalOption2}` : "Choice B"}</option>
                  {modalOption3 && <option value={modalOption3}>C: {modalOption3}</option>}
                  {modalOption4 && <option value={modalOption4}>D: {modalOption4}</option>}
                </select>
              </div>

              <div>
                <label className="block text-[#CBD5E1] font-semibold mb-1">
                  Technical Explanation / Rationale
                </label>
                <textarea
                  rows={2}
                  value={modalExplanation}
                  onChange={(e) => setModalExplanation(e.target.value)}
                  placeholder="Detailed explanation shown to students after test completion..."
                  className="w-full p-2.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-xs focus:outline-none focus:border-[#0078D4]"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuestionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                >
                  {editingQuestionIndex !== null ? "Update Question" : "Save Question"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
