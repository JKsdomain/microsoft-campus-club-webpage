"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Megaphone, X, ArrowRight } from "lucide-react";
import { INITIAL_ANNOUNCEMENTS, Announcement } from "@/lib/adminState";

export const AnnouncementBar: React.FC = () => {
  const [publishedText, setPublishedText] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("mcc_announcements");
      if (stored) {
        const parsed: Announcement[] = JSON.parse(stored);
        const publishedList = parsed.filter((a) => a.published);
        if (publishedList.length > 0) {
          publishedList.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setPublishedText(publishedList[0].text);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to read announcements in AnnouncementBar", e);
    }
    const pub = INITIAL_ANNOUNCEMENTS.find((a) => a.published);
    if (pub) {
      setPublishedText(pub.text);
    }
  }, []);

  if (!publishedText || dismissed) return null;

  return (
    <div className="w-full bg-[#0078D4]/15 border-b border-[#0078D4]/30 px-4 py-2.5 text-xs text-[#F8FAFC]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <Link
          href="/announcements"
          className="flex items-center space-x-2.5 flex-1 min-w-0 group hover:opacity-95 transition-opacity"
        >
          <div className="p-1 rounded bg-[#0078D4] text-white flex-shrink-0">
            <Megaphone className="w-3.5 h-3.5" />
          </div>
          <p className="truncate font-medium flex-1 min-w-0">
            <span className="font-semibold text-[#22D3EE] mr-1.5 uppercase tracking-wide">
              Announcement:
            </span>
            {publishedText}
          </p>
          <span className="hidden sm:inline-flex items-center gap-1 text-[#22D3EE] font-semibold hover:underline flex-shrink-0 text-xs">
            View all
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded text-[#94A3B8] hover:text-white hover:bg-white/10 flex-shrink-0"
          aria-label="Dismiss Announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
