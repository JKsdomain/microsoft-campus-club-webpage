"use client";

import React, { useState } from "react";
import { UserCheck, Shield, CheckCircle2, ArrowRight } from "lucide-react";
import { useAdminAuth } from "./AdminAuthProvider";
import { Button } from "../ui/Button";

export const ResponsibilityAssignment: React.FC = () => {
  const { officeBearers, assignments, assignObToActivity } = useAdminAuth();

  const [selectedActivityId, setSelectedActivityId] = useState<string>(
    assignments[0]?.id || ""
  );
  const [selectedObId, setSelectedObId] = useState<string>("");
  const [notification, setNotification] = useState<string | null>(null);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivityId || !selectedObId) return;

    const activity = assignments.find((a) => a.id === selectedActivityId);
    const ob = officeBearers.find((o) => o.id === selectedObId);

    if (activity && ob) {
      assignObToActivity(selectedActivityId, selectedObId);
      setNotification(
        `Assigned "${ob.name}" to strictly manage "${activity.activityName}". Any previous responsibility for this OB was replaced.`
      );
      setTimeout(() => setNotification(null), 4500);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Assignment Control Box */}
      <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-6">
        <div className="pb-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-[#0078D4]" />
            <h3 className="text-lg font-bold text-[#F8FAFC]">
              Assign Responsibility (1 OB → 1 Responsibility)
            </h3>
          </div>
          <span className="text-xs font-mono text-[#22D3EE] bg-[#22D3EE]/10 px-2.5 py-0.5 rounded-full border border-[#22D3EE]/20">
            STRICT 1:1 ENFORCED
          </span>
        </div>

        <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Select Activity Module
            </label>
            <select
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
            >
              {assignments.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.activityName} ({act.assignmentStatus})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#CBD5E1] mb-1.5">
              Select Office Bearer
            </label>
            <select
              value={selectedObId}
              onChange={(e) => setSelectedObId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] text-sm focus:outline-none focus:border-[#0078D4]"
            >
              <option value="">-- Choose Office Bearer --</option>
              {officeBearers.map((ob) => (
                <option key={ob.id} value={ob.id}>
                  {ob.name} — Currently: {ob.responsibility}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!selectedObId || !selectedActivityId}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full h-11"
            >
              Assign Responsibility
            </Button>
          </div>
        </form>
      </div>

      {/* Activity Responsibilities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map((act) => (
          <div
            key={act.id}
            className="p-5 rounded-2xl bg-[#0D1B2A] border border-white/10 flex items-center justify-between shadow-md hover:border-white/20 transition-all"
          >
            <div className="space-y-1">
              <span className="text-xs font-mono text-[#0078D4] block">MCC ACTIVITY</span>
              <h4 className="text-base font-bold text-[#F8FAFC]">{act.activityName}</h4>
              <p className="text-xs text-[#94A3B8]">
                Assigned Lead:{" "}
                <span className="font-semibold text-white">
                  {act.assignedObName || "Unassigned"}
                </span>
              </p>
            </div>

            <div>
              {act.assignmentStatus === "Assigned" ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Assigned</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Unassigned
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
