import React from "react";
import { AnnouncementManager } from "@/components/admin/AnnouncementManager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Announcements — MCC Admin Panel",
  description: "Manage and publish announcements displayed on the MCC platform landing page.",
};

export default function AnnouncementsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Description */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
          Announcements
        </h2>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Manage announcements displayed on the MCC landing page.
        </p>
      </div>

      {/* Announcement Manager */}
      <AnnouncementManager />
    </div>
  );
}
