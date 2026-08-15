"use client";

import React from "react";
import { useOBAuth } from "@/components/office-bearer/OBAuthProvider";
import { FeedList } from "@/components/office-bearer/FeedCard";

export default function CommonFeedPage() {
  const { publishedFeedPosts } = useOBAuth();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Description */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
          Common Feed
        </h2>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Published MCC community announcements and technical updates.
        </p>
      </div>

      {/* Published Feed List */}
      <FeedList posts={publishedFeedPosts} />
    </div>
  );
}
