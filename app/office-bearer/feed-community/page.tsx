import React from "react";
import { FeedComposer } from "@/components/office-bearer/FeedComposer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed Community — MCC Office Bearer Panel",
  description: "Compose community updates and submit for Admin approval.",
};

export default function FeedCommunityPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Description */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
          Feed Community
        </h2>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Compose MCC community announcements and submit for Admin approval.
        </p>
      </div>

      {/* Feed Composer & Approval Queue */}
      <FeedComposer />
    </div>
  );
}
