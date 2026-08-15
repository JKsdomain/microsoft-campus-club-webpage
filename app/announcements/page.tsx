"use client";

import React, { useState, useEffect } from "react";
import { Megaphone, Calendar } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { AnnouncementBar } from "@/components/landing/AnnouncementBar";
import { Footer } from "@/components/landing/Footer";
import { Container } from "@/components/ui/Container";
import { INITIAL_ANNOUNCEMENTS, Announcement } from "@/lib/adminState";

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr.replace(" ", "T"));
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  } catch (e) {
    console.error(e);
  }
  return dateStr;
}

export default function AnnouncementsPage() {
  const [publishedAnnouncements, setPublishedAnnouncements] = useState<Announcement[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("mcc_announcements");
      if (stored) {
        const parsed: Announcement[] = JSON.parse(stored);
        const activeOnly = parsed.filter((a) => a.published);
        activeOnly.sort(
          (a, b) => new Date(b.createdAt.replace(" ", "T")).getTime() - new Date(a.createdAt.replace(" ", "T")).getTime()
        );
        setPublishedAnnouncements(activeOnly);
        setLoaded(true);
        return;
      }
    } catch (e) {
      console.error("Error reading announcements from localStorage:", e);
    }

    const initialActive = INITIAL_ANNOUNCEMENTS.filter((a) => a.published);
    initialActive.sort(
      (a, b) => new Date(b.createdAt.replace(" ", "T")).getTime() - new Date(a.createdAt.replace(" ", "T")).getTime()
    );
    setPublishedAnnouncements(initialActive);
    setLoaded(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#07111F] text-[#F8FAFC]">
      {/* Header */}
      <Navbar />
      <AnnouncementBar />

      {/* Main Content */}
      <main className="flex-grow py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="max-w-4xl mx-auto space-y-10">
            {/* Page Header */}
            <div className="border-b border-white/10 pb-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0078D4]/10 border border-[#0078D4]/30 text-xs font-semibold uppercase tracking-wider text-[#22D3EE]">
                <Megaphone className="w-3.5 h-3.5" />
                <span>Official Bulletin</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#F8FAFC] tracking-tight">
                ANNOUNCEMENTS
              </h1>
              <p className="text-base text-[#CBD5E1] max-w-2xl leading-relaxed font-normal">
                Stay updated with the latest official announcements, releases, and notifications from the Microsoft Campus Club.
              </p>
            </div>

            {/* Announcement List */}
            {loaded && (
              <div className="space-y-6">
                {publishedAnnouncements.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-[#0D1B2A] border border-white/10 space-y-3">
                    <Megaphone className="w-10 h-10 text-[#94A3B8] mx-auto opacity-40" />
                    <h3 className="text-lg font-semibold text-[#F8FAFC]">No announcements yet</h3>
                    <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
                      There are no published announcements at this time. Please check back later for updates.
                    </p>
                  </div>
                ) : (
                  publishedAnnouncements.map((ann) => (
                    <article
                      key={ann.id}
                      className="p-6 sm:p-8 rounded-2xl bg-[#0D1B2A] border border-white/10 hover:border-white/20 transition-colors shadow-lg shadow-black/20 space-y-4"
                    >
                      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#0078D4] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22D3EE]" />
                          Official Announcement
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8] font-mono">
                          <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                          <span>Published: {formatDate(ann.createdAt)}</span>
                        </div>
                      </div>

                      <p className="text-base text-[#F8FAFC] leading-relaxed font-normal whitespace-pre-wrap">
                        {ann.text}
                      </p>
                    </article>
                  ))
                )}
              </div>
            )}
          </div>
        </Container>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
