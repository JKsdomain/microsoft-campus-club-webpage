"use client";

import React, { useState } from "react";
import { Proposal } from "@/lib/adminState";
import { useAdminAuth } from "./AdminAuthProvider";
import { Button } from "../ui/Button";
import { ProposalReviewModal } from "./ProposalReviewModal";

export const ApprovalList: React.FC = () => {
  const { proposals, approveProposal, rejectProposal } = useAdminAuth();
  const [filterStatus, setFilterStatus] = useState<"Pending" | "Approved" | "Rejected" | "All">("Pending");
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  const filteredProposals = proposals.filter((p) => {
    if (filterStatus === "All") return true;
    return p.status === filterStatus;
  });

  const pendingCount = proposals.filter((p) => p.status === "Pending").length;
  const approvedCount = proposals.filter((p) => p.status === "Approved").length;
  const rejectedCount = proposals.filter((p) => p.status === "Rejected").length;

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setFilterStatus("Pending")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            filterStatus === "Pending"
              ? "bg-[#0078D4] text-white shadow-md"
              : "bg-[#0D1B2A] text-[#94A3B8] hover:text-white border border-white/10"
          }`}
        >
          Pending Review ({pendingCount})
        </button>

        <button
          onClick={() => setFilterStatus("Approved")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            filterStatus === "Approved"
              ? "bg-emerald-600 text-white shadow-md"
              : "bg-[#0D1B2A] text-[#94A3B8] hover:text-white border border-white/10"
          }`}
        >
          Approved ({approvedCount})
        </button>

        <button
          onClick={() => setFilterStatus("Rejected")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            filterStatus === "Rejected"
              ? "bg-red-600 text-white shadow-md"
              : "bg-[#0D1B2A] text-[#94A3B8] hover:text-white border border-white/10"
          }`}
        >
          Rejected ({rejectedCount})
        </button>

        <button
          onClick={() => setFilterStatus("All")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            filterStatus === "All"
              ? "bg-purple-600 text-white shadow-md"
              : "bg-[#0D1B2A] text-[#94A3B8] hover:text-white border border-white/10"
          }`}
        >
          All Proposals ({proposals.length})
        </button>
      </div>

      {/* Proposals List Table */}
      <div className="rounded-2xl bg-[#0D1B2A] border border-white/10 overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#CBD5E1]">
            <thead className="bg-[#07111F] text-xs font-mono uppercase tracking-wider text-[#94A3B8] border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Proposal Title</th>
                <th className="px-6 py-4">Submitted By</th>
                <th className="px-6 py-4">Submitted Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProposals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#94A3B8]">
                    No proposals found in the &quot;{filterStatus}&quot; category.
                  </td>
                </tr>
              ) : (
                filteredProposals.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Type */}
                    <td className="px-6 py-4">
                      <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-[#0078D4]/10 border border-[#0078D4]/20 text-[#22D3EE]">
                        {item.type}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="px-6 py-4 font-bold text-[#F8FAFC]">
                      {item.title}
                    </td>

                    {/* Submitted By */}
                    <td className="px-6 py-4 text-xs text-[#CBD5E1]">
                      {item.submittedBy}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-xs font-mono text-[#94A3B8]">
                      {item.submittedDate}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {item.status === "Pending" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Pending
                        </span>
                      )}
                      {item.status === "Approved" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Approved
                        </span>
                      )}
                      {item.status === "Rejected" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          Rejected
                        </span>
                      )}
                    </td>

                    {/* Review Action */}
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProposal(item)}
                      >
                        Review
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <ProposalReviewModal
        isOpen={!!selectedProposal}
        proposal={selectedProposal}
        onClose={() => setSelectedProposal(null)}
        onApprove={approveProposal}
        onReject={rejectProposal}
      />
    </div>
  );
};
