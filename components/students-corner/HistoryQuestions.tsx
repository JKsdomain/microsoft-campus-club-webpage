"use client";

import React, { useState } from "react";
import { HISTORY_PLACEMENT_SETS, HistorySet } from "@/lib/studentState";
import { History, Calendar, CheckCircle2, Eye, ArrowLeft, BookOpen, HelpCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";

export const HistoryQuestions: React.FC = () => {
  const [selectedSet, setSelectedSet] = useState<HistorySet | null>(null);

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

          <div className="flex items-center space-x-2">
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
            <BookOpen className="w-3.5 h-3.5" />
            <span>READ-ONLY EDUCATIONAL REVISION</span>
          </div>
          <h2 className="text-2xl font-bold text-[#F8FAFC]">{selectedSet.title}</h2>
          <p className="text-xs text-[#94A3B8] font-mono">
            Originally Published: {selectedSet.completedDate} • Topic: {selectedSet.topic}
          </p>
        </div>

        {/* Questions & Explanations List (Read-Only Learning View) */}
        <div className="space-y-8">
          {selectedSet.questions.map((q, idx) => (
            <div
              key={q.id}
              className="p-6 sm:p-8 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-6"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold font-mono text-[#22D3EE] uppercase tracking-wider">
                  Question {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-[11px] font-mono text-[#94A3B8]">
                  Placement Archive
                </span>
              </div>

              {/* Question Text */}
              <p className="text-base text-[#F8FAFC] font-semibold leading-relaxed">
                {q.question}
              </p>

              {/* Choices List */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-mono uppercase text-[#94A3B8] font-semibold block mb-1">
                  Options:
                </span>
                {q.options.map((opt, oIdx) => {
                  const optionLabel = String.fromCharCode(65 + oIdx);
                  const isCorrect = opt === q.correctAnswer;

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
                      <span className="pt-0.5 leading-relaxed flex-1">{opt}</span>
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
                  <span>Correct Answer: {q.correctAnswer}</span>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <span className="text-[#22D3EE] font-semibold block mb-1">
                    Explanation:
                  </span>
                  <p className="text-[#CBD5E1] leading-relaxed font-normal">
                    {q.explanation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Archive List View with Pagination:
  const PAGE_SIZE = 5;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const visibleSets = HISTORY_PLACEMENT_SETS.slice(0, visibleCount);
  const hasMore = visibleCount < HISTORY_PLACEMENT_SETS.length;

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + PAGE_SIZE);
      setLoadingMore(false);
    }, 400);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
      {/* Section Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-2">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#0078D4]/10 text-[#22D3EE]">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#F8FAFC]">History Questions</h2>
            <p className="text-xs sm:text-sm text-[#CBD5E1]">
              Previously published Placement Questions and their answers.
            </p>
          </div>
        </div>
      </div>

      {/* Archive Cards List */}
      {HISTORY_PLACEMENT_SETS.length === 0 ? (
        <EmptyState
          title="No Previous Questions Yet"
          description="Previously published Placement Questions will appear here."
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

                <div className="flex items-center space-x-4 text-xs text-[#94A3B8] font-mono pt-1">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span>Published: {set.completedDate}</span>
                  </span>
                  <span>• {set.questions.length} Questions</span>
                </div>
              </div>

              <Button
                onClick={() => setSelectedSet(set)}
                variant="primary"
                size="md"
                leftIcon={<Eye className="w-4 h-4" />}
                className="self-start sm:self-center"
              >
                View Questions
              </Button>
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
