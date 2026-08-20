"use client";

import React, { useState, useMemo } from "react";
import { Download, CheckCircle2, AlertCircle, FileCheck, Info } from "lucide-react";
import { Button } from "../ui/Button";

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
];

const GENDERS = ["Male", "Female", "Other"];

const SEMESTERS = [
  "1st Semester",
  "2nd Semester",
  "3rd Semester",
  "4th Semester",
  "5th Semester",
  "6th Semester",
  "7th Semester",
  "8th Semester",
];

const BATCHES = ["2022-2026", "2023-2027", "2024-2028", "2025-2029"];

const RESIDENCE_TYPES = ["Day Scholar", "Hosteller"];

const COMPETENCIES = [
  "C",
  "Web Design",
  "Photoshop",
  "Android",
  "Java",
  "Python",
  "Video Editing",
  "Flutter",
];

export const MembershipForm: React.FC = () => {
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [name, setName] = useState<string>("");
  const [rollNumberSection, setRollNumberSection] = useState<string>("");
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [gender, setGender] = useState<string>(GENDERS[0]);
  const [semester, setSemester] = useState<string>(SEMESTERS[4]); // Default 5th
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const [batch, setBatch] = useState<string>(BATCHES[1]); // Default 2023-2027
  const [hostellerDayScholar, setHostellerDayScholar] = useState<string>(RESIDENCE_TYPES[0]);
  const [email, setEmail] = useState<string>("");
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>(["C", "Web Design"]);
  const [declarationAccepted, setDeclarationAccepted] = useState<boolean>(false);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const [generatedFilename, setGeneratedFilename] = useState<string>("MCC_Membership_Form.pdf");

  // Validate email format
  const isEmailValid = useMemo(() => {
    if (!email) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email.trim());
  }, [email]);

  // Real-time button enablement rule
  const isFormValid = useMemo(() => {
    return (
      date.trim().length > 0 &&
      name.trim().length > 0 &&
      rollNumberSection.trim().length > 0 &&
      department.trim().length > 0 &&
      gender.trim().length > 0 &&
      semester.trim().length > 0 &&
      dateOfBirth.trim().length > 0 &&
      batch.trim().length > 0 &&
      hostellerDayScholar.trim().length > 0 &&
      isEmailValid &&
      selectedCompetencies.length > 0 &&
      declarationAccepted === true
    );
  }, [
    date,
    name,
    rollNumberSection,
    department,
    gender,
    semester,
    dateOfBirth,
    batch,
    hostellerDayScholar,
    isEmailValid,
    selectedCompetencies,
    declarationAccepted,
  ]);

  const toggleCompetency = (comp: string) => {
    setSelectedCompetencies((prev) =>
      prev.includes(comp) ? prev.filter((c) => c !== comp) : [...prev, comp]
    );
  };

  const handleGeneratePDF = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/students-corner/generate-membership-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          name: name.trim(),
          rollNumberSection: rollNumberSection.trim(),
          department,
          gender,
          semester,
          dateOfBirth,
          batch,
          hostellerDayScholar,
          email: email.trim(),
          technicalCompetencies: selectedCompetencies,
          declarationAccepted,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Unable to generate your membership form. Please try again.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPdfDownloadUrl(url);

      const sanitizedRoll = rollNumberSection.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `MCC_Membership_Form_${sanitizedRoll || "Student"}.pdf`;
      setGeneratedFilename(filename);

      // Trigger automatic browser download
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMessage("Membership form generated successfully. Your PDF has been downloaded.");
    } catch (err: any) {
      console.error("PDF Generation error:", err);
      setErrorMessage(err.message || "Unable to generate your membership form. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[#0D1B2A] border border-white/10 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0078D4]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0078D4]/10 border border-[#0078D4]/20 text-[#0078D4]">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider">
              MCC MEMBERSHIP
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC]">
            Student Membership Application
          </h2>

          <p className="text-sm text-[#CBD5E1] max-w-2xl leading-relaxed">
            Complete your membership details to generate your official MCC membership form.
          </p>
        </div>
      </div>

      {/* Main Application Form */}
      <form onSubmit={handleGeneratePDF} className="space-y-8">
        {/* Form Container */}
        <div className="rounded-2xl bg-[#0D1B2A]/90 border border-white/10 p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Section 1: Basic Information */}
          <div className="border-b border-white/10 pb-4 mb-6">
            <h3 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#0078D4]" />
              Personal &amp; Academic Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Application Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#0078D4]"
              />
            </div>

            {/* Roll Number & Section */}
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Roll Number &amp; Section <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={rollNumberSection}
                onChange={(e) => setRollNumberSection(e.target.value)}
                placeholder="e.g. 21CS101 - Sec A"
                className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#0078D4]"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Department <span className="text-red-400">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Gender <span className="text-red-400">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Semester <span className="text-red-400">*</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                {SEMESTERS.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Date of Birth (D.O.B) <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
              />
            </div>

            {/* Batch */}
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Batch <span className="text-red-400">*</span>
              </label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                {BATCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Hosteller / Day Scholar */}
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Hosteller / Day Scholar <span className="text-red-400">*</span>
              </label>
              <select
                value={hostellerDayScholar}
                onChange={(e) => setHostellerDayScholar(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                {RESIDENCE_TYPES.map((res) => (
                  <option key={res} value={res}>
                    {res}
                  </option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex.morgan@student.edu"
                className={`w-full h-11 px-3.5 rounded-xl bg-[#07111F] border text-[#F8FAFC] placeholder-[#94A3B8] text-sm focus:outline-none ${
                  email && !isEmailValid
                    ? "border-red-500 focus:border-red-500"
                    : "border-white/15 focus:border-[#0078D4]"
                }`}
              />
              {email && !isEmailValid && (
                <span className="text-xs text-red-400 mt-1 block">
                  Please enter a valid email format (e.g. user@domain.com).
                </span>
              )}
            </div>
          </div>

          {/* Section 2: Technical Competency */}
          <div className="pt-6 border-t border-white/10 space-y-3">
            <label className="block text-sm font-bold text-[#F8FAFC]">
              Technical Competency <span className="text-red-400">*</span>
            </label>
            <p className="text-xs text-[#94A3B8]">
              Select all technical domains you have experience or interest in:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {COMPETENCIES.map((comp) => {
                const isSelected = selectedCompetencies.includes(comp);
                return (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => toggleCompetency(comp)}
                    className={`p-3 rounded-xl border text-xs font-medium transition-all text-left flex items-center justify-between ${
                      isSelected
                        ? "bg-[#0078D4]/20 border-[#0078D4] text-[#0078D4] dark:text-white font-semibold"
                        : "bg-[#07111F] border-white/15 text-[#CBD5E1] hover:border-[#0078D4] dark:hover:border-white/30"
                    }`}
                  >
                    <span>{comp}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0078D4]" />}
                  </button>
                );
              })}
            </div>
            {selectedCompetencies.length === 0 && (
              <span className="text-xs text-red-400 block">
                At least one technical competency must be selected.
              </span>
            )}
          </div>

          {/* Section 3: Official Declaration */}
          <div className="pt-6 border-t border-white/10 space-y-4">
            <div className="p-4 rounded-xl bg-[#07111F] border border-white/10 space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={declarationAccepted}
                  onChange={(e) => setDeclarationAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/20 text-[#0078D4] focus:ring-[#0078D4]"
                />
                <span className="text-xs text-[#CBD5E1] leading-relaxed">
                  I agree to abide by the rules and regulations of Microsoft Campus Club regarding student membership and functioning of the club.
                </span>
              </label>
              <p className="text-[11px] text-[#94A3B8] font-mono pl-7">
                Note: Amount to be paid for membership is Rs. 300 for 3 years.
              </p>
            </div>
          </div>

          {/* Office Use Notice */}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start space-x-3">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Official Notice:</strong> The &ldquo;FOR OFFICE USE ONLY&rdquo; section and Faculty Advisor Signatures will be processed by club authorities after submitting your generated PDF form.
            </span>
          </div>

        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center space-x-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-between animate-fade-in">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
            {pdfDownloadUrl && (
              <a
                href={pdfDownloadUrl}
                download={generatedFilename}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF Again
              </a>
            )}
          </div>
        )}

        {/* Form Submit Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl">
          <div className="text-xs text-[#94A3B8]">
            {isFormValid ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> All required fields validated.
              </span>
            ) : (
              <span>Fill all required fields to enable PDF generation.</span>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!isFormValid || isGenerating}
            leftIcon={
              isGenerating ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )
            }
            className="w-full sm:w-auto min-w-[240px]"
          >
            {isGenerating ? "Generating PDF..." : "Generate Membership Form"}
          </Button>
        </div>
      </form>
    </div>
  );
};
