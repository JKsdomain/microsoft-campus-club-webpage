"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { OfficeBearer } from "@/lib/adminState";
import { Button } from "../ui/Button";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (obData: { name: string; email: string; department: string; responsibility: string; status: "Active" | "Inactive" }) => void;
  initialData?: OfficeBearer | null;
}

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Information Technology",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
];

const RESPONSIBILITIES = [
  "Placement Questions Lead",
  "General Quiz Coordinator",
  "Technical Games Lead",
  "Feed Community Lead",
  "Unassigned",
];

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [responsibility, setResponsibility] = useState(RESPONSIBILITIES[0]);
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsSubmitting(false);
    if (initialData) {
      setName(initialData.name);
      setEmail(initialData.email);
      setDepartment(initialData.department);
      setResponsibility(initialData.responsibility);
      setStatus(initialData.status);
    } else {
      setName("");
      setEmail("");
      setDepartment(DEPARTMENTS[0]);
      setResponsibility(RESPONSIBILITIES[4]); // Unassigned default
      setStatus("Active");
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name,
        email,
        department,
        responsibility,
        status,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 sm:p-8 shadow-2xl relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <h3 className="text-xl font-bold text-[#F8FAFC]">
            {initialData ? "Edit Office Bearer" : "Add Office Bearer"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Full Name
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

          <div>
            <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex.morgan@mcc.edu"
              className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#0078D4]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept} className="bg-[#07111F] text-[#F8FAFC]">
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
                Initial Responsibility
              </label>
              <select
                value={responsibility}
                onChange={(e) => setResponsibility(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
              >
                {RESPONSIBILITIES.map((resp) => (
                  <option key={resp} value={resp} className="bg-[#07111F] text-[#F8FAFC]">
                    {resp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Account Status
            </label>
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center space-x-2 text-sm text-[#F8FAFC]">
                <input
                  type="radio"
                  name="status"
                  value="Active"
                  checked={status === "Active"}
                  onChange={() => setStatus("Active")}
                  className="text-[#0078D4] focus:ring-[#0078D4]"
                />
                <span>Active</span>
              </label>
              <label className="inline-flex items-center space-x-2 text-sm text-[#F8FAFC]">
                <input
                  type="radio"
                  name="status"
                  value="Inactive"
                  checked={status === "Inactive"}
                  onChange={() => setStatus("Inactive")}
                  className="text-[#0078D4] focus:ring-[#0078D4]"
                />
                <span>Inactive</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3 mt-6">
            <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : initialData
                ? "Save Changes"
                : "Create Office Bearer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
