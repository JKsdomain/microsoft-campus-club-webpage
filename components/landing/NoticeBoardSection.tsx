"use client";

import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Calendar,
  HelpCircle,
  Trophy,
  Users,
  Briefcase,
  Download,
  ExternalLink,
  FileText,
  Clock,
  MapPin,
  UserCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";

interface PublicNotice {
  id: string;
  title: string;
  noticeType: "QUIZ_NOTICE" | "EVENT_NOTICE" | "QUIZ_WINNERS_NOTICE" | "ACTIVE_PARTICIPANTS_NOTICE" | "PLACEMENT_QUESTIONS_NOTICE";
  eventName?: string | null;
  contentData: any;
  status: string;
  publishedAt?: string | null;
  pdfUrl: string;
}

const NOTICE_TABS = [
  {
    type: "QUIZ_NOTICE" as const,
    label: "Quiz Notice",
    shortLabel: "Quiz",
    icon: HelpCircle,
    color: "from-blue-500/20 to-cyan-500/10",
    badgeColor: "text-[#22D3EE] bg-[#22D3EE]/10 border-[#22D3EE]/30",
    description: "Weekly speed trivia rounds and quiz announcements",
  },
  {
    type: "EVENT_NOTICE" as const,
    label: "Event Notice",
    shortLabel: "Event",
    icon: Calendar,
    color: "from-purple-500/20 to-pink-500/10",
    badgeColor: "text-purple-300 bg-purple-500/10 border-purple-500/30",
    description: "Official offline workshops, symposia, and tech events",
  },
  {
    type: "QUIZ_WINNERS_NOTICE" as const,
    label: "Quiz Winners Notice",
    shortLabel: "Winners",
    icon: Trophy,
    color: "from-amber-500/20 to-yellow-500/10",
    badgeColor: "text-amber-300 bg-amber-500/10 border-amber-500/30",
    description: "Felicitating winners and top scorers of weekly challenges",
  },
  {
    type: "ACTIVE_PARTICIPANTS_NOTICE" as const,
    label: "Active Participants Notice",
    shortLabel: "Participants",
    icon: Users,
    color: "from-emerald-500/20 to-teal-500/10",
    badgeColor: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    description: "Recognizing active contributors and participants",
  },
  {
    type: "PLACEMENT_QUESTIONS_NOTICE" as const,
    label: "Placement Questions Notice",
    shortLabel: "Placement",
    icon: Briefcase,
    color: "from-blue-600/20 to-indigo-500/10",
    badgeColor: "text-[#0078D4] bg-[#0078D4]/10 border-[#0078D4]/30",
    description: "Curated company interview questions and mock tests",
  },
];

export const NoticeBoardSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "QUIZ_NOTICE" | "EVENT_NOTICE" | "QUIZ_WINNERS_NOTICE" | "ACTIVE_PARTICIPANTS_NOTICE" | "PLACEMENT_QUESTIONS_NOTICE"
  >("QUIZ_NOTICE");

  const [notices, setNotices] = useState<PublicNotice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPublishedNotices() {
      try {
        setLoading(true);
        const res = await fetch("/api/notices?public=true");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.notices)) {
            setNotices(data.notices);
          }
        }
      } catch (e) {
        console.error("Failed to load published notices:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchPublishedNotices();
  }, []);

  const activeTabMeta = NOTICE_TABS.find((t) => t.type === activeTab)!;
  const tabNotices = notices.filter((n) => n.noticeType === activeTab);
  const activeNotice = tabNotices[0] || null;
  const cd = activeNotice?.contentData || {};

  return (
    <section id="notice-board" className="py-16 sm:py-24 bg-[#07111F] border-t border-white/10 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#0078D4]/10 rounded-full blur-[120px] pointer-events-none" />

      <Container>
        <div className="max-w-6xl mx-auto space-y-10 relative z-10">
          
          {/* Section Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0078D4]/10 border border-[#0078D4]/30 text-xs font-semibold uppercase tracking-wider text-[#0078D4]">
              <Megaphone className="w-3.5 h-3.5 text-[#0078D4]" />
              <span>OFFICIAL NOTICE BOARD</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F8FAFC] tracking-tight">
              Microsoft Campus Club Notice Board
            </h2>
            <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed">
              Official announcements, event circulars, weekly quiz schedules, winners felicitations, and placement test notices published by Office Bearers.
            </p>
          </div>

          {/* 5 Event / Notice Tabs */}
          <div className="p-1.5 sm:p-2 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl overflow-x-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2 min-w-[580px] lg:min-w-0">
              {NOTICE_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.type;
                const count = notices.filter((n) => n.noticeType === tab.type).length;

                return (
                  <button
                    key={tab.type}
                    onClick={() => setActiveTab(tab.type)}
                    className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-left transition-all duration-200 relative ${
                      isActive
                        ? "bg-[#0078D4] text-white shadow-lg shadow-[#0078D4]/25"
                        : "text-[#CBD5E1] hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-[#22D3EE]"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-semibold truncate leading-tight">
                        {tab.label}
                      </div>
                      <div className={`text-[10px] font-mono mt-0.5 truncate ${isActive ? "text-white/80" : "text-[#94A3B8]"}`}>
                        {count > 0 ? `${count} active notice` : "Latest notice"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Notice Display */}
          <div className="rounded-3xl bg-[#0D1B2A] border border-white/10 shadow-2xl overflow-hidden p-6 sm:p-8 lg:p-10 space-y-8">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <span className="w-8 h-8 border-3 border-[#0078D4] border-t-transparent rounded-full animate-spin inline-block" />
                <p className="text-sm text-[#94A3B8]">Loading official notice...</p>
              </div>
            ) : !activeNotice ? (
              <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[#07111F] border border-white/10 flex items-center justify-center mx-auto text-[#94A3B8]">
                  <activeTabMeta.icon className="w-7 h-7 text-[#0078D4]" />
                </div>
                <h3 className="text-xl font-bold text-[#F8FAFC]">
                  No Notice Currently Published
                </h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  There are no active notices published under <span className="text-white font-semibold">&quot;{activeTabMeta.label}&quot;</span> right now. Check back soon for official updates.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Notice Header Row */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-mono font-semibold px-3 py-1 rounded-full border ${activeTabMeta.badgeColor}`}>
                        {activeTabMeta.label.toUpperCase()}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Official Notice</span>
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-[#F8FAFC] tracking-tight">
                      {activeNotice.title}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
                    <a
                      href={`${activeNotice.pdfUrl}&download=true`}
                      download
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#0078D4] text-white hover:bg-[#0078D4]/90 transition-all flex items-center gap-2 shadow-lg shadow-[#0078D4]/20"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Official PDF</span>
                    </a>
                    <a
                      href={activeNotice.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#07111F] border border-white/15 text-[#22D3EE] hover:text-white hover:border-white/30 flex items-center gap-2 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Fullscreen</span>
                    </a>
                  </div>
                </div>

                {/* Structured Notice Metadata Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Type 1: Quiz Notice */}
                  {activeNotice.noticeType === "QUIZ_NOTICE" && (
                    <>
                      <div className="p-4 rounded-2xl bg-[#07111F] border border-white/10 space-y-1">
                        <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Quiz Topic</span>
                        <p className="text-sm font-bold text-white">{cd.quizName || activeNotice.title}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#07111F] border border-white/10 space-y-1">
                        <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Published Date</span>
                        <p className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#22D3EE]" />
                          <span>{activeNotice.publishedAt || "Recently Published"}</span>
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#07111F] border border-white/10 space-y-1">
                        <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Participation Link</span>
                        <a
                          href={cd.quizLink || "/students-corner"}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#22D3EE] hover:underline flex items-center gap-1 truncate block"
                        >
                          <span>{cd.quizLink || "Open Quiz Portal"}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                    </>
                  )}

                  {/* Type 2: Event Notice */}
                  {activeNotice.noticeType === "EVENT_NOTICE" && (
                    <>
                      <div className="p-4 rounded-2xl bg-[#07111F] border border-white/10 space-y-1">
                        <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Event Date &amp; Time</span>
                        <p className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#22D3EE]" />
                          <span>{cd.date || "TBA"} • {cd.time || "TBA"}</span>
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#07111F] border border-white/10 space-y-1">
                        <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Event Venue</span>
                        <p className="text-sm font-bold text-white flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-purple-400" />
                          <span>{cd.venue || "Campus Venue"}</span>
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#07111F] border border-white/10 space-y-1">
                        <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Presenters</span>
                        <p className="text-sm font-bold text-white truncate">
                          {Array.isArray(cd.presenters) ? cd.presenters.join(", ") : cd.presenters || "Distinguished Guests"}
                        </p>
                      </div>
                    </>
                  )}

                  {/* Type 3: Quiz Winners Notice */}
                  {activeNotice.noticeType === "QUIZ_WINNERS_NOTICE" && (
                    <>
                      <div className="p-4 rounded-2xl bg-[#07111F] border border-white/10 space-y-1">
                        <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Competition</span>
                        <p className="text-sm font-bold text-white">{cd.quizName || activeNotice.title}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#07111F] border border-white/10 space-y-1">
                        <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Total Winners</span>
                        <p className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span>{Array.isArray(cd.winners) ? `${cd.winners.length} Felicitation Winners` : "Winners Announced"}</span>
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#07111F] border border-white/10 space-y-1">
                        <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Published Date</span>
                        <p className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#22D3EE]" />
                          <span>{activeNotice.publishedAt || "Verified"}</span>
                        </p>
                      </div>
                    </>
                  )}

                  {/* Type 4: Active Participants Notice */}
                  {activeNotice.noticeType === "ACTIVE_PARTICIPANTS_NOTICE" && (
                    <>
                      <div className="p-4 rounded-2xl bg-[#07111F] border border-white/10 space-y-1">
                        <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Activity Name</span>
                        <p className="text-sm font-bold text-white">{cd.activityName || activeNotice.title}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#07111F] border border-white/10 space-y-1">
                        <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Recognized Students</span>
                        <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{Array.isArray(cd.participants) ? `${cd.participants.length} Active Participants` : "Recognized"}</span>
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#07111F] border border-white/10 space-y-1">
                        <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Published Date</span>
                        <p className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#22D3EE]" />
                          <span>{activeNotice.publishedAt || "Verified"}</span>
                        </p>
                      </div>
                    </>
                  )}

                  {/* Type 5: Placement Questions Notice */}
                  {activeNotice.noticeType === "PLACEMENT_QUESTIONS_NOTICE" && (
                    <>
                      <div className="p-4 rounded-2xl bg-[#07111F] border border-white/10 space-y-1">
                        <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Activity Topic</span>
                        <p className="text-sm font-bold text-white">{cd.activityName || activeNotice.title}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#07111F] border border-white/10 space-y-1">
                        <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Practice Portal</span>
                        <a
                          href={cd.link || "/students-corner"}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#22D3EE] hover:underline flex items-center gap-1 truncate block"
                        >
                          <span>{cd.link || "Open Placement Tests"}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                      <div className="p-4 rounded-2xl bg-[#07111F] border border-white/10 space-y-1">
                        <span className="text-[11px] font-mono text-[#94A3B8] uppercase">Target Audience</span>
                        <p className="text-sm font-bold text-white">Pre-final &amp; Final Year Students</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Additional Note if available */}
                {cd.additionalContent && (
                  <div className="p-4 rounded-2xl bg-[#07111F]/80 border border-white/5 space-y-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#22D3EE]">
                      Official Note / Instructions:
                    </span>
                    <p className="text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">
                      {cd.additionalContent}
                    </p>
                  </div>
                )}

                {/* LIVE EMBEDDED OFFICIAL NOTICE PDF VIEWER */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#94A3B8]">
                      <FileText className="w-4 h-4 text-[#0078D4]" />
                      <span>Official Stamped Circular PDF Preview</span>
                    </div>
                    <span className="text-xs text-[#94A3B8] font-mono">
                      Scroll to view complete document
                    </span>
                  </div>

                  <div className="w-full h-[550px] sm:h-[650px] rounded-2xl bg-[#07111F] border border-white/15 overflow-hidden shadow-2xl relative">
                    <iframe
                      src={activeNotice.pdfUrl}
                      title={activeNotice.title}
                      className="w-full h-full rounded-2xl"
                    />
                  </div>
                </div>

                {/* Previous Notices Carousel/List for this Tab (if more than 1 notice exists) */}
                {tabNotices.length > 1 && (
                  <div className="pt-6 border-t border-white/10 space-y-3">
                    <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#94A3B8]">
                      Previous Published Notices in this Category ({tabNotices.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tabNotices.map((pn) => (
                        <div
                          key={pn.id}
                          className="p-3.5 rounded-xl bg-[#07111F] border border-white/10 flex items-center justify-between"
                        >
                          <div className="space-y-0.5 truncate">
                            <span className="text-xs font-bold text-white block truncate">{pn.title}</span>
                            <span className="text-[10px] text-[#94A3B8] font-mono">{pn.publishedAt}</span>
                          </div>
                          <a
                            href={`${pn.pdfUrl}&download=true`}
                            download
                            className="p-1.5 rounded-lg text-[#22D3EE] hover:bg-white/10 flex-shrink-0"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </Container>
    </section>
  );
};
