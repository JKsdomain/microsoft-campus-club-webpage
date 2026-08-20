"use client";

import React, { useState } from "react";
import { Plus, Megaphone, CheckCircle2, Edit2, Trash2, X, Upload, Pin, ImageIcon, AlertCircle } from "lucide-react";
import { Announcement, AnnouncementPoster } from "@/lib/adminState";
import { useAdminAuth } from "./AdminAuthProvider";
import { Button } from "../ui/Button";

export const AnnouncementManager: React.FC = () => {
  const {
    announcements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    togglePublishAnnouncement,
  } = useAdminAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);

  const [annTitle, setAnnTitle] = useState("");
  const [annText, setAnnText] = useState("");
  const [poster, setPoster] = useState<AnnouncementPoster | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [status, setStatus] = useState<"PUBLISHED" | "DRAFT" | "ARCHIVED">("PUBLISHED");

  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setEditingAnn(null);
    setAnnTitle("");
    setAnnText("");
    setPoster(null);
    setIsPinned(false);
    setStatus("PUBLISHED");
    setUploadError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setEditingAnn(ann);
    setAnnTitle(ann.title || "MCC Event Notice");
    setAnnText(ann.text || ann.description || "");
    setPoster(ann.poster || null);
    setIsPinned(Boolean(ann.isPinned));
    setStatus(ann.status || (ann.published ? "PUBLISHED" : "DRAFT"));
    setUploadError(null);
    setModalOpen(true);
  };

  // Image validation & poster upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setUploadError("Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP.");
      return;
    }

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Poster file size exceeds 5MB limit. Please select a smaller image.");
      return;
    }

    setUploadError(null);
    setIsUploadingPoster(true);

    try {
      const formData = new FormData();
      formData.append("poster", file);

      const res = await fetch("/api/admin/upload-poster", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Unable to upload the poster. Please try again.");
      }

      const data = await res.json();
      setPoster({ url: data.url, publicId: data.publicId, type: "IMAGE" });
    } catch (err: any) {
      console.error("Poster upload failed:", err);
      setUploadError(err.message || "Unable to upload the poster. Please try again.");
    } finally {
      setIsUploadingPoster(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annText.trim() || isSubmitting || isUploadingPoster) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: annTitle.trim() || "MCC Event Notice",
        poster: poster,
        isPinned: isPinned,
        status: status,
      };

      if (editingAnn) {
        await updateAnnouncement(editingAnn.id, annText.trim(), payload);
      } else {
        await addAnnouncement(annText.trim(), payload);
      }
      setModalOpen(false);
      setAnnTitle("");
      setAnnText("");
      setPoster(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Create Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#F8FAFC]">
            MCC Digital Notice Board ({announcements.length})
          </h3>
          <p className="text-xs text-[#94A3B8]">
            Publish weekly MCC offline event notices with optional Cloudinary poster images.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Create Notice / Announcement
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#0D1B2A] border border-white/10 text-[#94A3B8]">
            <Megaphone className="w-8 h-8 text-[#94A3B8] mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notices published yet. Click &quot;Create Notice / Announcement&quot; to publish one.</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className={`p-6 rounded-2xl bg-[#0D1B2A] border transition-all ${
                ann.isPinned
                  ? "border-[#0078D4] shadow-lg shadow-[#0078D4]/20 bg-[#0D1B2A]/90"
                  : ann.published
                  ? "border-white/15"
                  : "border-white/10 opacity-75"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Poster Thumbnail */}
                {ann.poster && ann.poster.url ? (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-[#07111F] border border-white/10 overflow-hidden flex-shrink-0 relative group">
                    <img
                      src={ann.poster.url}
                      alt={ann.title || "Poster"}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] flex-shrink-0">
                    <ImageIcon className="w-6 h-6 opacity-40" />
                  </div>
                )}

                {/* Notice Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {ann.isPinned && (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0078D4]/20 text-[#0078D4] border border-[#0078D4]/40">
                        <Pin className="w-3 h-3 fill-current" />
                        <span>PINNED NOTICE</span>
                      </span>
                    )}

                    {ann.published ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PUBLISHED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/5 text-[#94A3B8] border border-white/10">
                        DRAFT
                      </span>
                    )}

                    <span className="text-xs font-mono text-[#94A3B8]">
                      {ann.createdAt}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[#F8FAFC]">
                    {ann.title || "MCC Event Notice"}
                  </h4>

                  <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed line-clamp-3">
                    {ann.text || ann.description}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 flex-shrink-0 self-start md:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePublishAnnouncement(ann.id)}
                    className={ann.published ? "text-amber-400 border-amber-500/30" : "text-emerald-400 border-emerald-500/30"}
                  >
                    {ann.published ? "Unpublish" : "Publish"}
                  </Button>

                  <button
                    onClick={() => handleOpenEdit(ann)}
                    className="p-2 rounded-lg text-[#CBD5E1] hover:text-white hover:bg-white/10"
                    title="Edit Announcement"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => deleteAnnouncement(ann.id)}
                    className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Dialog for Create / Edit Notice */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-16 sm:pt-20 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-[#F8FAFC]">
                {editingAnn ? "Edit MCC Notice" : "Create MCC Event Notice"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Notice Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Weekly General Quiz — Offline Arena"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#0078D4]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Notice Description / Details <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={annText}
                  onChange={(e) => setAnnText(e.target.value)}
                  placeholder="Enter details regarding location, timing, and instructions for the MCC event..."
                  className="w-full p-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#0078D4] leading-relaxed"
                />
              </div>

              {/* Poster Upload Field */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-[#CBD5E1]">
                  Event Poster (Optional Image)
                </label>

                {poster && poster.url ? (
                  <div className="relative p-3 rounded-xl bg-[#07111F] border border-white/15 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={poster.url}
                        alt="Poster Preview"
                        className="w-12 h-12 object-contain rounded bg-black/40 border border-white/10"
                      />
                      <div>
                        <span className="text-xs font-semibold text-emerald-400 block">
                          Poster uploaded successfully.
                        </span>
                        <span className="text-[10px] text-[#94A3B8] font-mono">
                          Cloudinary Image Ready
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPoster(null)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      title="Remove Poster"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#07111F] border border-dashed border-white/20 hover:border-[#0078D4] cursor-pointer text-xs text-[#CBD5E1] transition-colors">
                      <Upload className="w-4 h-4 text-[#0078D4]" />
                      <span>{isUploadingPoster ? "Uploading Poster..." : "Upload Poster Image (JPG, PNG, WEBP)"}</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        disabled={isUploadingPoster}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {uploadError && (
                  <div className="text-xs text-red-400 flex items-center gap-1.5 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              {/* Pin Announcement Checkbox */}
              <div className="pt-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 text-[#0078D4] focus:ring-[#0078D4]"
                  />
                  <span className="text-xs font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5 text-[#0078D4]" />
                    Pin this announcement (Display as Primary Pinned Notice)
                  </span>
                </label>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Publish Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
                >
                  <option value="PUBLISHED">Published</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting || isUploadingPoster}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting || isUploadingPoster}
                >
                  {isSubmitting
                    ? "Publishing Notice..."
                    : isUploadingPoster
                    ? "Uploading Poster..."
                    : editingAnn
                    ? "Save Notice"
                    : "Publish Announcement"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
