"use client";

import React, { useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "../ui/Button";

export type ModalType = "success" | "invalid" | "error" | null;

interface LoginModalProps {
  type: ModalType;
  role: "admin" | "office-bearer";
  message?: string;
  onConfirm: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  type,
  role,
  message,
  onConfirm,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (type) {
      // Focus OK button when modal opens
      setTimeout(() => {
        buttonRef.current?.focus();
      }, 50);
    }
  }, [type]);

  if (!type) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      onConfirm();
    }
  };

  const getModalConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle2 className="w-10 h-10 text-[#22D3EE]" />,
          iconBg: "bg-[#22D3EE]/10 border-[#22D3EE]/30",
          title: "Login Successful",
          description: message || "Authentication completed successfully.",
        };
      case "invalid":
        return {
          icon: <AlertCircle className="w-10 h-10 text-amber-400" />,
          iconBg: "bg-amber-500/10 border-amber-500/30",
          title: "Login Failed",
          description: message || "Invalid email or password.",
        };
      case "error":
      default:
        return {
          icon: <AlertTriangle className="w-10 h-10 text-red-400" />,
          iconBg: "bg-red-500/10 border-red-500/30",
          title: "Unable to Sign In",
          description: message || "We couldn't connect to the MCC platform. Please try again.",
        };
    }
  };

  const config = getModalConfig();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      onKeyDown={handleKeyDown}
    >
      <div className="w-full max-w-[420px] rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 sm:p-8 text-center shadow-2xl shadow-black/80 relative animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Icon Circle */}
        <div
          className={`w-16 h-16 rounded-full border flex items-center justify-center mx-auto mb-4 ${config.iconBg}`}
        >
          {config.icon}
        </div>

        {/* Title */}
        <h3
          id="modal-title"
          className="text-xl font-bold text-[#F8FAFC] mb-2 tracking-tight"
        >
          {config.title}
        </h3>

        {/* Description */}
        <p
          id="modal-description"
          className="text-sm text-[#CBD5E1] leading-relaxed mb-6 whitespace-pre-line"
        >
          {config.description}
        </p>

        {/* Explicit OK Button */}
        <Button
          ref={buttonRef}
          variant="primary"
          size="md"
          onClick={onConfirm}
          className="w-full"
        >
          OK
        </Button>
      </div>
    </div>
  );
};
