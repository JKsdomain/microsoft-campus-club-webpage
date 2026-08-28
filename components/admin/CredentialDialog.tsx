"use client";

import React, { useState } from "react";
import { X, KeyRound, CheckCircle2 } from "lucide-react";
import { OfficeBearer } from "@/lib/adminState";
import { Button } from "../ui/Button";

interface CredentialDialogProps {
  isOpen: boolean;
  ob: OfficeBearer | null;
  onClose: () => void;
  onConfirm: (id: string, newPassword: string) => Promise<void> | void;
}

export const CredentialDialog: React.FC<CredentialDialogProps> = ({
  isOpen,
  ob,
  onClose,
  onConfirm,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !ob) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);

    try {
      await onConfirm(ob.id, newPassword);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setNewPassword("");
        setConfirmPassword("");
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update credentials in database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-16 sm:pt-20 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-[#F8FAFC]">
              Change Credentials
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#22D3EE] mx-auto animate-pulse" />
            <h4 className="text-lg font-bold text-[#F8FAFC]">
              Credentials Updated!
            </h4>
            <p className="text-xs text-[#CBD5E1]">
              New password has been persisted to the database for {ob.name}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-[#07111F] border border-white/10">
              <span className="text-xs font-semibold text-[#F8FAFC] block">
                {ob.name}
              </span>
              <span className="text-xs text-[#94A3B8] font-mono block">
                {ob.email}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#0078D4]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#0078D4]"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-400 font-medium">{errorMsg}</p>
            )}

            <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3 mt-6">
              <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
