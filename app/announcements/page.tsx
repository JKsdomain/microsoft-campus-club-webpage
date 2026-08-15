"use client";

import React, { useState, useEffect } from "react";
import { Megaphone, Calendar, Pin, ArrowRight, X, ImageIcon } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { AnnouncementBar } from "@/components/landing/AnnouncementBar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Announcement } from "@/lib/adminState";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Announcement | null>(null);

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const res = await fetch("/api/admin/announcements");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.announcements)) {
            const active = data.announcements.filter((a: any) => a.isPublished || a.status === "PUBLISHED");
            setAnnouncements(active);
            setLoaded(true);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to fetch MongoDB announcements:", e);
      }

      // LocalStorage fallback
      try {
        const stored = localStorage.getItem("mcc_announcements");
        if (stored) {
          const parsed: Announcement[] = JSON.parse(stored);
          const activeOnly = parsed.filter((a) => a.published);
          setAnnouncements(activeOnly);
        }
      } catch (e) {
        console.error("Error reading announcements from localStorage:", e);
      }
      setLoaded(true);
    }

    loadAnnouncements();
  }, []);

  const pinnedNotice = announcements.find((a) => a.isPinned) || announcements[0] || null;
  const previousNotices = announcements.filter((a) => a.id !== pinnedNotice?.id);

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
                {announcements.length === 0 ? (
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
                          
                          {/* Poster Image Column */}
                          {pinnedNotice.poster && pinnedNotice.poster.url ? (
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
                                MCC Offline Event
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

                            <div className="pt-2">
                              <Button
                                onClick={() => setSelectedNotice(pinnedNotice)}
                                variant="primary"
                                size="md"
                                rightIcon={<ArrowRight className="w-4 h-4" />}
                              >
                                View Notice &rarr;
                              </Button>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}

                    {/* PREVIOUS ANNOUNCEMENTS GRID */}
                    {previousNotices.length > 0 && (
                      <div className="space-y-6 pt-6 border-t border-white/10">
                        <h3 className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-[#94A3B8]">
                          PREVIOUS ANNOUNCEMENTS ({previousNotices.length})
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {previousNotices.map((ann) => (
                            <div
                              key={ann.id}
                              onClick={() => setSelectedNotice(ann)}
                              className="group p-5 rounded-2xl bg-[#0D1B2A] border border-white/10 hover:border-[#0078D4]/50 transition-all cursor-pointer shadow-lg space-y-4 flex flex-col justify-between"
                            >
                              <div className="space-y-3">
                                {ann.poster && ann.poster.url ? (
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
                                  <span>MCC Notice</span>
                                  <span>{ann.createdAt}</span>
                                </div>

                                <h4 className="text-base font-bold text-[#F8FAFC] group-hover:text-[#0078D4] transition-colors leading-snug">
                                  {ann.title || "MCC Event Notice"}
                                </h4>

                                <p className="text-xs text-[#CBD5E1] line-clamp-3 leading-relaxed">
                                  {ann.text || ann.description}
                                </p>
                              </div>

                              <div className="pt-3 border-t border-white/5 text-xs font-semibold text-[#0078D4] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                <span>View Notice</span>
                                <ArrowRight className="w-3.5 h-3.5" />
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

      {/* FULL-SIZE NOTICE VIEW MODAL (Centered full-viewport layout) */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-16 sm:pt-20 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider text-[#0078D4] font-semibold">
                Official MCC Notice
              </span>
              <button
                onClick={() => setSelectedNotice(null)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Poster Image Full Display */}
            {selectedNotice.poster && selectedNotice.poster.url && (
              <div className="rounded-xl bg-[#07111F] border border-white/10 p-3 max-h-[380px] flex items-center justify-center">
                <img
                  src={selectedNotice.poster.url}
                  alt={selectedNotice.title || "Notice Poster"}
                  className="w-full max-h-[360px] object-contain rounded-lg"
                />
              </div>
            )}

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
            <div className="pt-4 border-t border-white/10 flex justify-end">
              <Button
                variant="primary"
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
