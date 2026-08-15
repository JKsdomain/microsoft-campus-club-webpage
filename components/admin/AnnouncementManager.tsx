"use client";

import React, { useState } from "react";
import { Plus, Megaphone, CheckCircle2, Edit2, Trash2, X } from "lucide-react";
import { Announcement } from "@/lib/adminState";
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
  const [annText, setAnnText] = useState("");

  const handleOpenAdd = () => {
    setEditingAnn(null);
    setAnnText("");
    setModalOpen(true);
  };

  const handleOpenEdit = (ann: Announcement) => {
    setEditingAnn(ann);
    setAnnText(ann.text);
    setModalOpen(true);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingAnn) {
        await updateAnnouncement(editingAnn.id, annText.trim());
      } else {
        await addAnnouncement(annText.trim());
      }
      setModalOpen(false);
      setAnnText("");
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
            Landing Page Announcements ({announcements.length})
          </h3>
          <p className="text-xs text-[#94A3B8]">
            Text-only announcements displayed in the landing page top alert bar.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Create Announcement
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#0D1B2A] border border-white/10 text-[#94A3B8]">
            <Megaphone className="w-8 h-8 text-[#94A3B8] mx-auto mb-2 opacity-50" />
            <p className="text-sm">No announcements found. Click &quot;Create Announcement&quot; to publish one.</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div
              key={ann.id}
              className={`p-6 rounded-2xl bg-[#0D1B2A] border transition-all ${
                ann.published
                  ? "border-[#0078D4]/50 shadow-lg shadow-[#0078D4]/10"
                  : "border-white/10"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3">
                    {ann.published ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PUBLISHED ON LANDING PAGE</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/5 text-[#94A3B8] border border-white/10">
                        DRAFT / ARCHIVED
                      </span>
                    )}
                    <span className="text-xs font-mono text-[#94A3B8]">
                      Created: {ann.createdAt}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-[#F8FAFC] leading-relaxed">
                    &quot;{ann.text}&quot;
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 flex-shrink-0">
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

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-16 sm:pt-20 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-[#F8FAFC]">
                {editingAnn ? "Edit Announcement" : "Create Announcement"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-2">
                  Announcement Text (Text Only)
                </label>
                <textarea
                  rows={4}
                  required
                  value={annText}
                  onChange={(e) => setAnnText(e.target.value)}
                  placeholder="Enter announcement text..."
                  className="w-full p-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#0078D4] leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Publishing..."
                    : editingAnn
                    ? "Save Changes"
                    : "Publish"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
