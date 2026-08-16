"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Megaphone, X, ArrowRight } from "lucide-react";
import { Announcement } from "@/lib/adminState";

export const AnnouncementBar: React.FC = () => {
  const [latestNotice, setLatestNotice] = useState<{ title: string; text: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    async function loadLatestAnnouncement() {
      try {
        const res = await fetch("/api/admin/announcements");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.announcements) && data.announcements.length > 0) {
            const active = data.announcements.filter((a: any) => a.isPublished || a.status === "PUBLISHED");
            const pinned = active.find((a: any) => a.isPinned) || active[0];
            if (pinned) {
              setLatestNotice({
                title: pinned.title || "Weekly MCC Event",
                text: pinned.text || pinned.description || "",
              });
              return;
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch latest announcement in AnnouncementBar", e);
      }
    }

    loadLatestAnnouncement();
  }, []);

  if (!latestNotice || dismissed) return null;

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
            <span className="font-bold text-[#0078D4] mr-2 uppercase tracking-wide">
              📢 THIS WEEK AT MCC:
            </span>
            <span className="font-semibold text-[#F8FAFC] mr-1.5">{latestNotice.title}</span>
            <span className="text-[#CBD5E1] hidden md:inline">— {latestNotice.text}</span>
          </p>
          <span className="inline-flex items-center gap-1 text-[#0078D4] font-semibold hover:underline flex-shrink-0 text-xs">
            View Notice &rarr;
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
