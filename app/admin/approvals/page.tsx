import React from "react";
import { ApprovalList } from "@/components/admin/ApprovalList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Approval Workflow — MCC Admin Panel",
  description: "Review and approve module proposals submitted by Office Bearers.",
};

export default function ApprovalWorkflowPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Description */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
          Approval Workflow
        </h2>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Review proposals submitted by Office Bearers.
        </p>
      </div>

      {/* Proposal Table & Reviews */}
      <ApprovalList />
    </div>
  );
}
