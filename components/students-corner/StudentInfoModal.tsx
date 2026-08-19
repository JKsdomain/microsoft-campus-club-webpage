"use client";

import React, { useState } from "react";
import { STUDENT_DEPARTMENTS, STUDENT_YEARS, StudentInfo } from "@/lib/studentState";
import { User, Mail, GraduationCap, Calendar, Hash, Building2, AlertTriangle, ArrowRight, Loader2, X } from "lucide-react";
import { Button } from "../ui/Button";

interface StudentInfoModalProps {
  isOpen: boolean;
  testType: "Placement Questions" | "General Quiz";
  testTitle: string;
  onClose: () => void;
  onProceed: (studentInfo: StudentInfo) => void;
}

export const StudentInfoModal: React.FC<StudentInfoModalProps> = ({
  isOpen,
  testType,
  testTitle,
  onClose,
  onProceed,
}) => {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState<string>(STUDENT_DEPARTMENTS[0]);
  const [year, setYear] = useState<string>(STUDENT_YEARS[0]);
  const [section, setSection] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedSection = section.trim();
    const trimmedEmail = email.trim();
    const trimmedRoll = rollNumber.trim();

    // Field Validations
    if (!trimmedName) {
      setError("Please enter your Full Name.");
      return;
    }
    if (!department) {
      setError("Please select your Department.");
      return;
    }
    if (!year) {
      setError("Please select your Year of study.");
      return;
    }
    if (!trimmedSection) {
      setError("Please enter your Section (e.g., A, B, C).");
      return;
    }
    if (!trimmedEmail) {
      setError("Please enter your Email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid Email address format (e.g. student@college.edu).");
      return;
    }
    if (!trimmedRoll) {
      setError("Please enter your Roll Number.");
      return;
    }

    const studentInfo: StudentInfo = {
      name: trimmedName,
      department,
      year,
      section: trimmedSection,
      email: trimmedEmail,
      rollNumber: trimmedRoll,
    };

    // Pre-flight Attempt Check against MongoDB (Level 1 Protection)
    setIsChecking(true);
    try {
      const res = await fetch("/api/students-corner/validate-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityName: testType,
          email: trimmedEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.allowed) {
        if (data.code === "ALREADY_ATTEMPTED") {
          setError("You have already attempted this test. Only one attempt is allowed per student.");
        } else {
          setError(data.message || "This activity is not currently available for participation.");
        }
        setIsChecking(false);
        return;
      }

      // Success — Proceed to test
      setIsChecking(false);
      onProceed(studentInfo);
    } catch (err: any) {
      console.error("Validation error:", err);
      setError("Failed to verify attempt status. Please check your connection and try again.");
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 sm:p-8 shadow-2xl space-y-6 relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isChecking}
          className="absolute top-5 right-5 text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#0078D4]/15 border border-[#0078D4]/30 text-[#22D3EE] flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#F8FAFC]">Enter Your Details</h3>
          <p className="text-xs text-[#CBD5E1]">
            Please enter your academic information before starting <span className="font-semibold text-white">{testTitle}</span>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start space-x-2.5 animate-shake">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Student Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#CBD5E1] flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Full Name <span className="text-red-400">*</span></span>
            </label>
            <input
              type="text"
              required
              disabled={isChecking}
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#07111F] border border-white/10 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] transition-all"
            />
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#CBD5E1] flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Department <span className="text-red-400">*</span></span>
            </label>
            <select
              required
              disabled={isChecking}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#07111F] border border-white/10 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] transition-all cursor-pointer"
            >
              {STUDENT_DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept} className="bg-[#0D1B2A] text-white">
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Year & Section Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Year */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#CBD5E1] flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>Year <span className="text-red-400">*</span></span>
              </label>
              <select
                required
                disabled={isChecking}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#07111F] border border-white/10 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] transition-all cursor-pointer"
              >
                <option value="1" className="bg-[#0D1B2A] text-white">1st Year</option>
                <option value="2" className="bg-[#0D1B2A] text-white">2nd Year</option>
                <option value="3" className="bg-[#0D1B2A] text-white">3rd Year</option>
                <option value="4" className="bg-[#0D1B2A] text-white">4th Year</option>
              </select>
            </div>

            {/* Section */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#CBD5E1] flex items-center space-x-1.5">
                <Hash className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>Section <span className="text-red-400">*</span></span>
              </label>
              <input
                type="text"
                required
                disabled={isChecking}
                placeholder="e.g. A, B, C"
                value={section}
                onChange={(e) => setSection(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#07111F] border border-white/10 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] transition-all uppercase"
                maxLength={4}
              />
            </div>
          </div>

          {/* Email ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#CBD5E1] flex items-center space-x-1.5">
              <Mail className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Email ID <span className="text-red-400">*</span></span>
            </label>
            <input
              type="email"
              required
              disabled={isChecking}
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#07111F] border border-white/10 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] transition-all"
            />
            <p className="text-[11px] text-[#94A3B8]">
              Used for single-attempt verification and recording your score.
            </p>
          </div>

          {/* Roll Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#CBD5E1] flex items-center space-x-1.5">
              <Hash className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>Roll Number <span className="text-red-400">*</span></span>
            </label>
            <input
              type="text"
              required
              disabled={isChecking}
              placeholder="e.g. 23BCS001"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#07111F] border border-white/10 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] transition-all uppercase"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end space-x-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={isChecking}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isChecking}
              leftIcon={isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
              rightIcon={!isChecking ? <ArrowRight className="w-4 h-4" /> : undefined}
              className="bg-[#0078D4] hover:bg-[#0078D4]/90 text-white min-w-[150px]"
            >
              {isChecking ? "Checking..." : "Continue to Test"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
