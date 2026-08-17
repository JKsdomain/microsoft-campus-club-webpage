"use client";

import React, { useState } from "react";
import { Send, Sparkles, CheckCircle2, Clock, Image, Video, UploadCloud, AlertCircle, X } from "lucide-react";
import { useOBAuth } from "./OBAuthProvider";
import { UnauthorizedGuard } from "./UnauthorizedGuard";
import { Button } from "../ui/Button";

export const FeedComposer: React.FC = () => {
  const { currentOb, hasResponsibility, submitFeedPost, feedPosts } = useOBAuth();
  const isAssigned = hasResponsibility("Feed Community");

  const [postContent, setPostContent] = useState("");
  const [mediaType, setMediaType] = useState<"none" | "image" | "video">("none");
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [mediaPublicId, setMediaPublicId] = useState<string>("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isAssigned) {
    return <UnauthorizedGuard activityName="Feed Community" />;
  }

  const handleMediaFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append("media", file);

      const res = await fetch("/api/office-bearer/feed/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Unable to upload the media. Please try again.");
      }

      const data = await res.json();
      setMediaType(data.type === "VIDEO" ? "video" : "image");
      setMediaUrl(data.url);
      setMediaPublicId(data.publicId || "");
    } catch (err: any) {
      alert(err.message || "Unable to upload media to Cloudinary. Please try again.");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleRemoveMedia = () => {
    setMediaType("none");
    setMediaUrl("");
    setMediaPublicId("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await submitFeedPost(postContent.trim(), mediaType, mediaUrl || undefined, mediaPublicId || undefined);
      setPostContent("");
      setMediaType("none");
      setMediaUrl("");
      setMediaPublicId("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err: any) {
      alert("Failed to submit post for approval. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingPosts = feedPosts.filter((p) => p.status === "Pending Approval");

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {submitSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <div>
            <span className="font-bold block">Post Submitted for Approval!</span>
            <span className="text-xs text-emerald-300">
              Your community post has been submitted to the Admin Approval Queue (Status: Pending Approval).
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Post Composer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-5">
            <div className="pb-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-[#0078D4]/10 text-[#22D3EE]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#F8FAFC]">
                    Create a Community Post
                  </h3>
                  <span className="text-xs text-[#94A3B8]">
                    Author: {currentOb.name} ({currentOb.department})
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono text-[#0078D4]">
                FEED COMPOSER
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <textarea
                  rows={5}
                  required
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="What's happening in MCC? Share technical updates, hackathon announcements, or project highlights with the campus community..."
                  className="w-full p-4 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#0078D4] leading-relaxed"
                />
              </div>

              {/* Cloudinary Media Attachment Area */}
              <div className="p-4 rounded-xl bg-[#07111F] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#CBD5E1] flex items-center space-x-2">
                    <UploadCloud className="w-4 h-4 text-[#22D3EE]" />
                    <span>Cloudinary Media Storage</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    IMAGE / VIDEO
                  </span>
                </div>

                {mediaType !== "none" && mediaUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 max-h-60 bg-black">
                    <button
                      type="button"
                      onClick={handleRemoveMedia}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-red-500 transition-colors z-10"
                      title="Remove Media"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {mediaType === "image" ? (
                      <img
                        src={mediaUrl}
                        alt="Media Preview"
                        className="w-full h-56 object-cover"
                      />
                    ) : (
                      <video
                        src={mediaUrl}
                        controls
                        className="w-full h-56 object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-4">
                    <label className="flex-1 cursor-pointer flex items-center justify-center space-x-2 p-3 rounded-xl border border-dashed border-white/20 hover:border-[#0078D4] bg-white/[0.02] text-xs text-[#CBD5E1] transition-colors">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleMediaFileChange}
                        disabled={isUploadingMedia}
                        className="hidden"
                      />
                      {isUploadingMedia ? (
                        <span className="animate-pulse text-[#22D3EE]">
                          Uploading to Cloudinary...
                        </span>
                      ) : (
                        <>
                          <Image className="w-4 h-4 text-[#0078D4]" />
                          <Video className="w-4 h-4 text-[#22D3EE]" />
                          <span>Attach Image or Video (Cloudinary)</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2 text-xs text-[#94A3B8]">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Posts require Admin approval before publication.</span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!postContent.trim() || isUploadingMedia || isSubmitting}
                  leftIcon={<Send className="w-4 h-4" />}
                >
                  {isSubmitting ? "Submitting..." : "Submit for Approval"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Pending Approval Queue Status */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-4">
            <div className="pb-3 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Approval Queue Status
              </h3>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>

            <div className="space-y-3">
              {pendingPosts.length === 0 ? (
                <p className="text-xs text-[#94A3B8] italic py-2">
                  No pending community post proposals.
                </p>
              ) : (
                pendingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-xl bg-[#07111F] border border-white/10 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#F8FAFC]">
                        {post.authorName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pending Approval
                      </span>
                    </div>
                    <p className="text-[#CBD5E1] line-clamp-2 italic">
                      &quot;{post.content}&quot;
                    </p>
                    {post.mediaType !== "none" && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400">
                        Media: {post.mediaType}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-[#94A3B8] block">
                      {post.timestamp}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
