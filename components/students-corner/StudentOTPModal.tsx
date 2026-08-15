"use client";

import React, { useState, useEffect } from "react";
import { Mail, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck } from "lucide-react";
import { Button } from "../ui/Button";

interface StudentOTPModalProps {
  isOpen: boolean;
  testTitle: string;
  onClose: () => void;
  onVerifiedSuccess: (username: string, email: string) => void;
}

export const StudentOTPModal: React.FC<StudentOTPModalProps> = ({
  isOpen,
  testTitle,
  onClose,
  onVerifiedSuccess,
}) => {
  const [step, setStep] = useState<"identity" | "otp">("identity");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !email.includes("@") || isSending) {
      setError("Please enter a valid Username and Email address.");
      return;
    }
    setIsSending(true);
    try {
      setError(null);
      setStep("otp");
      setCountdown(60);
    } finally {
      setIsSending(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otp.join("");
    if (fullCode.length < 6 || isVerifying) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (attemptsLeft <= 1) {
      setError("Maximum OTP verification attempts exceeded. Please request a new code.");
      setOtp(["", "", "", "", "", ""]);
      return;
    }

    setIsVerifying(true);
    try {
      setError(null);
      onVerifiedSuccess(username.trim(), email.trim());
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    setCountdown(60);
    setAttemptsLeft(5);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-[#0D1B2A] border border-white/15 shadow-2xl p-6 sm:p-8 space-y-6 text-[#F8FAFC] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {step === "identity" ? (
          <form onSubmit={handleSendOTP} className="space-y-5">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#0078D4]/20 border border-[#0078D4]/30 flex items-center justify-center mx-auto text-[#22D3EE]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F8FAFC]">Student Identity</h3>
              <p className="text-xs text-[#CBD5E1]">
                Enter your details to start <span className="font-semibold text-white">&quot;{testTitle}&quot;</span>. No password required.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Full Name / Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. Arun Kumar"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                  Student Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. arun.kumar@student.mcc.edu"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full h-11 font-semibold" disabled={isSending}>
              {isSending ? "Sending Code..." : "Send Verification OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#0078D4]/20 border border-[#0078D4]/30 flex items-center justify-center mx-auto text-[#0078D4]">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#F8FAFC]">Verify Your Email</h3>
              <p className="text-xs text-[#CBD5E1]">
                Enter the 6-digit verification code sent to <br />
                <strong className="text-[#22D3EE] font-mono">{email}</strong>
              </p>
              <span className="text-[11px] text-[#94A3B8] block font-mono">
                (Demo Test Code: 123456 or any 6 digits)
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 6-Digit OTP Box Grid */}
            <div className="flex items-center justify-center space-x-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-11 h-12 text-center text-lg font-bold font-mono rounded-xl bg-[#07111F] border border-white/20 text-[#F8FAFC] focus:outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/30"
                />
              ))}
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full h-11 font-semibold" disabled={isVerifying}>
              {isVerifying ? "Verifying..." : "Verify & Start Test"}
            </Button>

            <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-1">
              <span>Resend in {countdown}s</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0}
                className="flex items-center space-x-1 text-[#22D3EE] hover:underline disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend Code</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
