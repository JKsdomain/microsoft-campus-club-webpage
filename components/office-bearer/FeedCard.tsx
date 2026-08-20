"use client";

import React, { useState } from "react";
import { FeedPostItem } from "@/lib/obState";
import { UserCheck, ShieldCheck, ThumbsUp, ThumbsDown, Maximize2, X, Play, AlertCircle, Trash2 } from "lucide-react";
import { useOBAuth } from "./OBAuthProvider";
import { Button } from "../ui/Button";

export const FeedCard: React.FC<{ post: FeedPostItem }> = ({ post }) => {
  const { currentOb, isAuthenticated, toggleFeedVote, deleteFeedPost } = useOBAuth();
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isLiked = post.userVote === "like";
  const isDisliked = post.userVote === "dislike";

  const canDelete =
    isAuthenticated &&
    (currentOb.name === post.authorName ||
      currentOb.assignedResponsibility === "Feed Community");

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deleteFeedPost(post.id);
    setIsDeleting(false);
    if (success) {
      setConfirmDeleteOpen(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl shadow-black/20 space-y-4 hover:border-white/20 transition-all">
      {/* Author Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#0078D4]/20 border border-[#0078D4]/30 flex items-center justify-center text-[#22D3EE] font-bold">
            {post.authorName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#F8FAFC] text-sm sm:text-base">
                {post.authorName}
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#0078D4]/10 text-[#0078D4] border border-[#0078D4]/20">
                <UserCheck className="w-3 h-3" />
                <span>Office Bearer</span>
              </span>
            </div>
            <span className="text-xs text-[#94A3B8] font-mono">
              {post.authorDepartment}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-[#94A3B8] font-mono">
          <span>{post.timestamp}</span>
          {canDelete && (
            <button
              onClick={() => setConfirmDeleteOpen(true)}
              className="p-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
              title="Delete post"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Text Content */}
      <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed whitespace-pre-line">
        {post.content}
      </p>

      {/* Cloudinary Media Rendering (Image or Video) */}
      {post.mediaType !== "none" && post.mediaUrl && (
        <div className="rounded-xl overflow-hidden border border-white/10 bg-[#07111F] relative group">
          {post.mediaType === "image" ? (
            <div className="relative">
              <img
                src={post.mediaUrl}
                alt="Feed Media"
                className="w-full h-auto max-h-[480px] object-cover transition-transform duration-300 group-hover:scale-[1.01]"
              />
              <button
                onClick={() => setImageModalOpen(true)}
                className="absolute bottom-3 right-3 p-2 rounded-lg bg-black/60 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1.5 text-xs font-semibold"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>View Full</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              {videoError ? (
                <div className="p-8 text-center text-xs text-red-400 flex flex-col items-center justify-center space-y-2">
                  <AlertCircle className="w-6 h-6" />
                  <span>Unable to load video stream</span>
                </div>
              ) : (
                <video
                  src={post.mediaUrl}
                  controls
                  preload="metadata"
                  onError={() => setVideoError(true)}
                  className="w-full h-auto max-h-[480px] object-cover bg-black"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {imageModalOpen && post.mediaUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={post.mediaUrl}
              alt="Full Feed Media"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl border border-white/10"
            />
          </div>
        </div>
      )}

      {/* Like / Dislike Interaction Bar */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Like Button */}
          <button
            onClick={() => toggleFeedVote(post.id, "like")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              isLiked
                ? "bg-[#0078D4] text-white border-[#0078D4] shadow-md shadow-[#0078D4]/20"
                : "bg-[#07111F] text-[#CBD5E1] border-white/15 hover:border-white/30 hover:text-white"
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${isLiked ? "text-white fill-white" : "text-[#94A3B8]"}`} />
            <span>Like ({post.likesCount})</span>
          </button>

          {/* Dislike Button */}
          <button
            onClick={() => toggleFeedVote(post.id, "dislike")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              isDisliked
                ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20"
                : "bg-[#07111F] text-[#CBD5E1] border-white/15 hover:border-white/30 hover:text-white"
            }`}
          >
            <ThumbsDown className={`w-4 h-4 ${isDisliked ? "text-white fill-white" : "text-[#94A3B8]"}`} />
            <span>Dislike ({post.dislikesCount})</span>
          </button>
        </div>

        {/* Verified MCC Publication Badge */}
        <span className="hidden sm:flex items-center space-x-1 text-xs text-emerald-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Approved Publication</span>
        </span>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0D1B2A] border border-red-500/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">Delete this post?</h3>
                <p className="text-xs text-[#94A3B8]">Confirmation required</p>
              </div>
            </div>

            <p className="text-sm text-[#CBD5E1] leading-relaxed">
              Are you sure you want to remove this feed post? This action cannot be undone.
            </p>

            <div className="p-3 rounded-xl bg-[#07111F] border border-white/10 text-xs text-[#94A3B8] line-clamp-2 italic font-mono">
              &quot;{post.content}&quot;
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <Button
                variant="ghost"
                size="md"
                disabled={isDeleting}
                onClick={() => setConfirmDeleteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={isDeleting}
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const FeedList: React.FC<{ posts: FeedPostItem[] }> = ({ posts }) => {
  const PAGE_SIZE = 4;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  if (posts.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#0D1B2A] border border-white/10 text-[#94A3B8]">
        <p className="text-sm font-semibold text-[#F8FAFC]">No published posts yet</p>
        <p className="text-xs text-[#94A3B8] mt-1">
          There are currently no approved MCC community posts in the feed.
        </p>
      </div>
    );
  }

  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + PAGE_SIZE);
      setLoadingMore(false);
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {visiblePosts.map((post) => (
        <FeedCard key={post.id} post={post} />
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
            {loadingMore ? "Loading more posts..." : "Load More Posts"}
          </Button>
        </div>
      )}
    </div>
  );
};
