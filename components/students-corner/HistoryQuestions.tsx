"use client";

import React, { useState, useEffect } from "react";
import { HistorySet } from "@/lib/studentState";
import { History, Calendar, CheckCircle2, Eye, ArrowLeft, BookOpen, HelpCircle, Download, Bell, AlertTriangle } from "lucide-react";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { LoadingState } from "../ui/LoadingState";

export const HistoryQuestions: React.FC = () => {
  const [historySets, setHistorySets] = useState<HistorySet[]>([]);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<HistorySet | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Load history questions and dynamic lifecycle notification from MongoDB API
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/students-corner/history-questions");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.historySets)) {
            setHistorySets(data.historySets);
          }
          if (data.bannerNotice) {
            setBannerNotice(data.bannerNotice);
          }
        }
      } catch (err) {
        console.error("Failed to load history questions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Handle genuine PDF download via pdf-lib API
  const handleDownloadPDF = async (set: HistorySet) => {
    setDownloadingId(set.id);
    try {
      const res = await fetch("/api/students-corner/history-questions/download-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: set.id,
          title: set.title,
          weekName: set.weekName,
          publishedDate: set.completedDate,
          expiryDate: (set as any).expiresAt,
          questions: set.questions,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const safeTitle = (set.weekName || set.title || "placement-questions")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");
        a.download = `mcc-${safeTitle}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to download history questions PDF.");
      }
    } catch (e) {
      console.error("PDF download error:", e);
      alert("Network error while downloading PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  // If student is viewing questions of a selected historical Placement Question set:
  if (selectedSet) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <Button
            onClick={() => setSelectedSet(null)}
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to History Archive
          </Button>

          <div className="flex items-center space-x-3">
            <Button
              onClick={() => handleDownloadPDF(selectedSet)}
              disabled={downloadingId === selectedSet.id}
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="text-[#22D3EE] border-[#22D3EE]/30 hover:bg-[#22D3EE]/10"
            >
              {downloadingId === selectedSet.id ? "Generating PDF..." : "Download PDF"}
            </Button>
            <span className="text-xs font-mono text-[#0078D4] bg-[#0078D4]/10 px-3 py-1 rounded-full border border-[#0078D4]/30">
              {selectedSet.weekName}
            </span>
            <span className="text-xs font-mono text-[#94A3B8]">
              {selectedSet.questions.length} Questions
            </span>
          </div>
        </div>

        {/* Set Info Header */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
              <BookOpen className="w-3.5 h-3.5" />
              <span>READ-ONLY EDUCATIONAL REVISION</span>
            </div>
            {(selectedSet as any).expiresAt && (
              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                Archival Date: {(selectedSet as any).expiresAt}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-[#F8FAFC]">{selectedSet.title}</h2>
          <p className="text-xs text-[#94A3B8] font-mono">
            Originally Published: {selectedSet.completedDate} • Topic: {selectedSet.topic}
          </p>
        </div>

        {/* Questions & Explanations List (Read-Only Learning View) */}
        <div className="space-y-8">
          {!selectedSet.questions || selectedSet.questions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#0D1B2A] border border-white/10 text-sm text-[#94A3B8]">
              No question details found for this archived set.
            </div>
          ) : (
            selectedSet.questions.map((q, idx) => {
              const safeOptions = Array.isArray(q.options) ? q.options : [];
              const safeQuestionText = q.question || (q as any).questionText || `Question ${idx + 1}`;
              const safeExplanation = q.explanation || (q as any).exp || "Explanation provided for review and learning reference.";
              const safeCorrectAnswer = q.correctAnswer || (q as any).answer || safeOptions[0] || "";

              return (
                <div
                  key={q.id || idx}
                  className="p-6 sm:p-8 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-6"
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-xs font-bold font-mono text-[#22D3EE] uppercase tracking-wider">
                      Question {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[11px] font-mono text-[#94A3B8]">
                      Revision Archive
                    </span>
                  </div>

                  {/* Question Text */}
                  <p className="text-base text-[#F8FAFC] font-semibold leading-relaxed">
                    {safeQuestionText}
                  </p>

                  {/* Choices List */}
                  <div className="space-y-2.5">
                    <span className="text-[11px] font-mono uppercase text-[#94A3B8] font-semibold block mb-1">
                      Options:
                    </span>
                    {safeOptions.map((opt, oIdx) => {
                      const optionText = typeof opt === "string" ? opt : (opt as any)?.text || String(opt);
                      const optionLabel = String.fromCharCode(65 + oIdx);
                      const isCorrect = optionText === safeCorrectAnswer;

                      return (
                        <div
                          key={oIdx}
                          className={`p-3.5 rounded-xl border flex items-start space-x-3 text-xs transition-all ${
                            isCorrect
                              ? "bg-emerald-500/10 border-emerald-500/40 text-[#F8FAFC]"
                              : "bg-[#07111F] border-white/10 text-[#CBD5E1]"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              isCorrect
                                ? "bg-emerald-500 text-white"
                                : "bg-[#122438] text-[#94A3B8]"
                            }`}
                          >
                            {optionLabel}
                          </span>
                          <span className="pt-0.5 leading-relaxed flex-1">{optionText}</span>
                          {isCorrect && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 flex-shrink-0">
                              Correct Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Correct Answer & Detailed Explanation */}
                  <div className="p-4 rounded-xl bg-[#07111F] border border-emerald-500/20 space-y-2 text-xs">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Correct Answer: {safeCorrectAnswer}</span>
                    </div>

                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[#22D3EE] font-semibold block mb-1">
                        Explanation:
                      </span>
                      <p className="text-[#CBD5E1] leading-relaxed font-normal">
                        {safeExplanation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Archive List View with Pagination:
  const PAGE_SIZE = 5;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const visibleSets = historySets.slice(0, visibleCount);
  const hasMore = visibleCount < historySets.length;

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + PAGE_SIZE);
      setLoadingMore(false);
    }, 300);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Marquee Expiry Notification Banner (Issue 20) */}
      {bannerNotice && (
        <div className="overflow-hidden rounded-xl bg-gradient-to-r from-[#0078D4]/20 via-[#0D1B2A] to-[#22D3EE]/20 border border-[#0078D4]/30 p-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0078D4]/30 text-[#22D3EE] text-xs font-mono font-bold">
              <Bell className="w-3.5 h-3.5 animate-pulse" />
              <span>LIFECYCLE</span>
            </div>
            <div className="overflow-hidden whitespace-nowrap w-full">
              <div className="inline-block animate-marquee text-xs font-mono text-[#E2E8F0]">
                {bannerNotice}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-2">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#0078D4]/10 text-[#22D3EE]">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#F8FAFC]">History Questions</h2>
            <p className="text-xs sm:text-sm text-[#CBD5E1]">
              Previously published Placement Questions and their complete answers archive.
            </p>
          </div>
        </div>
      </div>

      {/* Archive Cards List */}
      {loading ? (
        <div className="py-12">
          <LoadingState label="Loading history questions from database..." />
        </div>
      ) : historySets.length === 0 ? (
        <EmptyState
          title="No history questions available."
          description="Previously published Placement Questions will appear here once archived."
          icon={<HelpCircle className="w-6 h-6 text-[#94A3B8]" />}
          className="py-12"
        />
      ) : (
        <div className="space-y-4">
          {visibleSets.map((set) => (
            <div
              key={set.id}
              className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/20 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-[#F8FAFC] text-base sm:text-lg">
                    {set.weekName}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Archived</span>
                  </span>
                </div>

                <p className="text-xs text-[#CBD5E1] font-medium">{set.title}</p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#94A3B8] font-mono pt-1">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span>Published: {set.completedDate}</span>
                  </span>
                  {(set as any).expiresAt && (
                    <span>• Expiry: {(set as any).expiresAt}</span>
                  )}
                  <span>• {set.questions.length} Questions</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <Button
                  onClick={() => handleDownloadPDF(set)}
                  disabled={downloadingId === set.id}
                  variant="outline"
                  size="md"
                  leftIcon={<Download className="w-4 h-4" />}
                  className="text-[#22D3EE] border-[#22D3EE]/30 hover:bg-[#22D3EE]/10"
                >
                  {downloadingId === set.id ? "PDF..." : "Download PDF"}
                </Button>
                <Button
                  onClick={() => setSelectedSet(set)}
                  variant="primary"
                  size="md"
                  leftIcon={<Eye className="w-4 h-4" />}
                >
                  View Questions
                </Button>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="pt-4 text-center">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="secondary"
                size="md"
                className="w-full sm:w-auto px-8"
              >
                {loadingMore ? "Loading more sets..." : "Load More Question Sets"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
