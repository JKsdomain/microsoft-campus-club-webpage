"use client";

import React, { useState, useEffect } from "react";
import { Megaphone, Calendar, Pin, ArrowRight, X, ImageIcon, Download, ExternalLink, FileText } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { AnnouncementBar } from "@/components/landing/AnnouncementBar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

interface NoticeItem {
  id: string;
  title: string;
  text: string;
  description: string;
  poster?: { url: string } | null;
  isPinned?: boolean;
  status: string;
  publishedDate?: string;
  createdAt: string;
  pdfUrl?: string | null;
  noticeType?: string | null;
  eventName?: string | null;
  isOfficialNotice?: boolean;
}

export default function AnnouncementsPage() {
  const [allNotices, setAllNotices] = useState<NoticeItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<NoticeItem | null>(null);

  useEffect(() => {
    async function loadData() {
      const combined: NoticeItem[] = [];

      // 1. Fetch published official notices from Notice Management System
      try {
        const noticeRes = await fetch("/api/notices?public=true");
        if (noticeRes.ok) {
          const nData = await noticeRes.json();
          if (Array.isArray(nData.notices)) {
            for (const n of nData.notices) {
              const cd = n.contentData || {};
              let summary = "";
              if (n.noticeType === "QUIZ_NOTICE") {
                summary = `Quiz Topic: ${cd.quizName || n.title}${cd.additionalContent ? ` • ${cd.additionalContent}` : ""}`;
              } else if (n.noticeType === "EVENT_NOTICE") {
                summary = `Event: ${cd.eventName || n.eventName || n.title} • Date: ${cd.date || "TBA"} • Time: ${cd.time || "TBA"} • Venue: ${cd.venue || "TBA"}`;
              } else if (n.noticeType === "QUIZ_WINNERS_NOTICE") {
                const count = Array.isArray(cd.winners) ? cd.winners.length : 0;
                summary = `Congratulations to all ${count} winner${count === 1 ? "" : "s"} of ${cd.quizName || n.title}!`;
              } else if (n.noticeType === "ACTIVE_PARTICIPANTS_NOTICE") {
                const count = Array.isArray(cd.participants) ? cd.participants.length : 0;
                summary = `Recognizing ${count} active participant${count === 1 ? "" : "s"} for ${cd.activityName || n.title}.`;
              } else if (n.noticeType === "PLACEMENT_QUESTIONS_NOTICE") {
                summary = `Placement Activity: ${cd.activityName || n.title}${cd.additionalContent ? ` • ${cd.additionalContent}` : ""}`;
              }

              combined.push({
                id: n.id,
                title: n.title,
                text: summary,
                description: summary,
                isPinned: true, // Official notices prioritized
                status: "PUBLISHED",
                publishedDate: n.publishedAt || new Date().toISOString().split("T")[0],
                createdAt: n.publishedAt || new Date().toISOString().split("T")[0],
                pdfUrl: n.pdfUrl,
                noticeType: n.noticeType,
                eventName: n.eventName,
                isOfficialNotice: true,
              });
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch official notices:", e);
      }

      // 2. Fetch admin announcements
      try {
        const res = await fetch("/api/admin/announcements");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.announcements)) {
            const active = data.announcements.filter((a: any) => a.isPublished || a.status === "PUBLISHED");
            for (const a of active) {
              combined.push({
                id: a.id,
                title: a.title || "MCC Notice",
                text: a.content || a.text || a.description || "",
                description: a.content || a.text || a.description || "",
                poster: a.poster,
                isPinned: Boolean(a.isPinned),
                status: a.status || "PUBLISHED",
                publishedDate: a.publishedDate || a.createdAt,
                createdAt: a.createdAt,
                isOfficialNotice: false,
              });
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch announcements:", e);
      }

      setAllNotices(combined);
      setLoaded(true);
    }

    loadData();
  }, []);

  const pinnedNotice = allNotices.find((a) => a.isPinned) || allNotices[0] || null;
  const previousNotices = allNotices.filter((a) => a.id !== pinnedNotice?.id);

  return (
    <div className="min-h-screen flex flex-col bg-[#07111F] text-[#F8FAFC]">
      {/* Header */}
      <Navbar />
      <AnnouncementBar />

      {/* Main Content */}
      <main className="flex-grow py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="max-w-5xl mx-auto space-y-12">
            
            {/* Page Header */}
            <div className="border-b border-white/10 pb-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0078D4]/10 border border-[#0078D4]/30 text-xs font-semibold uppercase tracking-wider text-[#0078D4]">
                <Megaphone className="w-3.5 h-3.5 text-[#0078D4]" />
                <span>MCC DIGITAL NOTICE BOARD</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#F8FAFC] tracking-tight">
                Official MCC Notice Board
              </h1>
              <p className="text-base text-[#CBD5E1] max-w-2xl leading-relaxed font-normal">
                Weekly offline MCC event announcements, General Quiz notices, Placement activities, and official club updates.
              </p>
            </div>

            {/* Content Area */}
            {loaded && (
              <div className="space-y-12">
                {allNotices.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-[#0D1B2A] border border-white/10 space-y-3">
                    <Megaphone className="w-10 h-10 text-[#94A3B8] mx-auto opacity-40" />
                    <h3 className="text-lg font-semibold text-[#F8FAFC]">No announcements yet</h3>
                    <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
                      There are no published event notices at this time. Please check back later for updates.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* PRIMARY PINNED / LATEST NOTICE */}
                    {pinnedNotice && (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-[#0078D4]">
                          <Pin className="w-4 h-4 text-[#0078D4] fill-current" />
                          <span>LATEST / PINNED NOTICE</span>
                        </div>

                        <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1B2A] border border-[#0078D4]/40 shadow-2xl shadow-[#0078D4]/10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                          
                          {/* Visual / PDF Thumbnail Column */}
                          {pinnedNotice.pdfUrl ? (
                            <div
                              onClick={() => setSelectedNotice(pinnedNotice)}
                              className="lg:col-span-5 rounded-2xl bg-[#07111F] border border-[#0078D4]/30 p-4 overflow-hidden cursor-pointer group flex flex-col items-center justify-center min-h-[240px] hover:border-[#0078D4] transition-all space-y-3"
                            >
                              <FileText className="w-16 h-16 text-[#0078D4] group-hover:scale-110 transition-transform" />
                              <div className="text-center">
                                <span className="text-xs font-bold text-white block">Official PDF Notice</span>
                                <span className="text-[11px] text-[#22D3EE] font-mono">Click to preview document</span>
                              </div>
                            </div>
                          ) : pinnedNotice.poster && pinnedNotice.poster.url ? (
                            <div
                              onClick={() => setSelectedNotice(pinnedNotice)}
                              className="lg:col-span-5 rounded-2xl bg-[#07111F] border border-white/10 p-2 overflow-hidden cursor-pointer group flex items-center justify-center max-h-[320px]"
                            >
                              <img
                                src={pinnedNotice.poster.url}
                                alt={pinnedNotice.title || "MCC Event Poster"}
                                className="w-full h-full max-h-[300px] object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="lg:col-span-5 rounded-2xl bg-[#07111F]/60 border border-white/10 p-8 flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]">
                              <ImageIcon className="w-10 h-10 text-[#0078D4] opacity-50" />
                              <span className="text-xs text-[#94A3B8] font-mono">Official Text Notice</span>
                            </div>
                          )}

                          {/* Notice Info Column */}
                          <div className="lg:col-span-7 space-y-5">
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                              <span className="text-xs font-bold uppercase tracking-wider text-[#0078D4]">
                                {pinnedNotice.noticeType
                                  ? pinnedNotice.noticeType.replace(/_/g, " ")
                                  : "MCC Offline Event"}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] font-mono">
                                <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                                <span>Published: {pinnedNotice.createdAt}</span>
                              </div>
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] leading-tight">
                              {pinnedNotice.title || "MCC Event Notice"}
                            </h2>

                            <p className="text-sm text-[#CBD5E1] leading-relaxed line-clamp-4 whitespace-pre-wrap">
                              {pinnedNotice.text || pinnedNotice.description}
                            </p>

                            <div className="pt-2 flex flex-wrap items-center gap-3">
                              <Button
                                onClick={() => setSelectedNotice(pinnedNotice)}
                                variant="primary"
                                size="md"
                                rightIcon={<ArrowRight className="w-4 h-4" />}
                              >
                                View Complete Notice
                              </Button>

                              {pinnedNotice.pdfUrl && (
                                <a
                                  href={`${pinnedNotice.pdfUrl}&download=true`}
                                  download
                                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#07111F] border border-white/15 text-[#CBD5E1] hover:text-white hover:border-white/30 flex items-center gap-2 transition-all shadow-md"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Download PDF</span>
                                </a>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>
                    )}

                    {/* PREVIOUS ANNOUNCEMENTS & NOTICES GRID */}
                    {previousNotices.length > 0 && (
                      <div className="space-y-6 pt-6 border-t border-white/10">
                        <h3 className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">
                          PUBLISHED NOTICES &amp; ANNOUNCEMENTS ({previousNotices.length})
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {previousNotices.map((ann) => (
                            <div
                              key={ann.id}
                              onClick={() => setSelectedNotice(ann)}
                              className="group p-5 rounded-2xl bg-[#0D1B2A] border border-white/10 hover:border-[#0078D4]/50 transition-all cursor-pointer shadow-lg space-y-4 flex flex-col justify-between"
                            >
                              <div className="space-y-3">
                                {ann.pdfUrl ? (
                                  <div className="h-44 rounded-xl bg-[#07111F] border border-white/10 flex flex-col items-center justify-center p-4 text-center group-hover:border-[#0078D4]/40 transition-colors">
                                    <FileText className="w-10 h-10 text-[#0078D4] mb-2" />
                                    <span className="text-xs font-bold text-white">Official Notice PDF</span>
                                    <span className="text-[10px] text-[#22D3EE] font-mono mt-0.5">Click to view document</span>
                                  </div>
                                ) : ann.poster && ann.poster.url ? (
                                  <div className="h-44 rounded-xl bg-[#07111F] border border-white/10 overflow-hidden flex items-center justify-center p-2">
                                    <img
                                      src={ann.poster.url}
                                      alt={ann.title || "Poster"}
                                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                ) : (
                                  <div className="h-28 rounded-xl bg-[#07111F] border border-white/5 flex items-center justify-center text-[#94A3B8]">
                                    <ImageIcon className="w-6 h-6 opacity-30" />
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-mono">
                                  <span className="text-[#0078D4] font-semibold">
                                    {ann.noticeType ? ann.noticeType.replace(/_/g, " ") : "MCC Notice"}
                                  </span>
                                  <span>{ann.createdAt}</span>
                                </div>

                                <h4 className="text-base font-bold text-[#F8FAFC] group-hover:text-[#0078D4] transition-colors leading-snug">
                                  {ann.title || "MCC Event Notice"}
                                </h4>

                                <p className="text-xs text-[#CBD5E1] line-clamp-3 leading-relaxed">
                                  {ann.text || ann.description}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-white/5 text-xs font-semibold text-[#0078D4] flex items-center justify-between">
                                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                  <span>View Notice</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                                {ann.pdfUrl && (
                                  <span className="text-[11px] text-[#22D3EE] font-mono flex items-center gap-1">
                                    <Download className="w-3 h-3" />
                                    PDF
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </Container>
      </main>

      {/* FULL-SIZE NOTICE VIEW MODAL */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-16 sm:pt-20 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-3xl rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider text-[#0078D4] font-semibold">
                {selectedNotice.noticeType ? selectedNotice.noticeType.replace(/_/g, " ") : "Official MCC Notice"}
              </span>
              <button
                onClick={() => setSelectedNotice(null)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If Notice has PDF: Embed Iframe */}
            {selectedNotice.pdfUrl ? (
              <div className="w-full h-[520px] rounded-xl bg-[#07111F] border border-white/10 overflow-hidden">
                <iframe
                  src={selectedNotice.pdfUrl}
                  title={selectedNotice.title}
                  className="w-full h-full rounded-xl"
                />
              </div>
            ) : selectedNotice.poster && selectedNotice.poster.url ? (
              <div className="rounded-xl bg-[#07111F] border border-white/10 p-3 max-h-[380px] flex items-center justify-center">
                <img
                  src={selectedNotice.poster.url}
                  alt={selectedNotice.title || "Notice Poster"}
                  className="w-full max-h-[360px] object-contain rounded-lg"
                />
              </div>
            ) : null}

            {/* Notice Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono border-b border-white/5 pb-2">
                <span>Published: {selectedNotice.createdAt}</span>
                <span className="text-emerald-400 font-semibold">Verified Active Notice</span>
              </div>

              <h2 className="text-2xl font-bold text-[#F8FAFC]">
                {selectedNotice.title || "MCC Event Notice"}
              </h2>

              <p className="text-sm text-[#CBD5E1] leading-relaxed whitespace-pre-wrap">
                {selectedNotice.text || selectedNotice.description}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              {selectedNotice.pdfUrl ? (
                <div className="flex items-center gap-2">
                  <a
                    href={`${selectedNotice.pdfUrl}&download=true`}
                    download
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0078D4] text-white hover:bg-[#0078D4]/90 transition-all flex items-center gap-1.5 shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official PDF</span>
                  </a>
                  <a
                    href={selectedNotice.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#07111F] border border-white/15 text-[#22D3EE] hover:text-white flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Fullscreen</span>
                  </a>
                </div>
              ) : <div />}

              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedNotice(null)}
              >
                Close Notice
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
