"use client";

import React, { useState } from "react";
import { Download, FileClock, Search, Shield, UserCheck, Eye, X, ArrowRight, Activity } from "lucide-react";
import { useAdminAuth } from "./AdminAuthProvider";
import { Button } from "../ui/Button";
import { AuditLog } from "@/lib/adminState";

export const AuditLogTable: React.FC = () => {
  const { auditLogs, exportAuditLogsToCSV } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const totalActions = auditLogs.length;
  const adminActions = auditLogs.filter((l) => l.role === "Administrator").length;
  const obActions = auditLogs.filter((l) => l.role === "Office Bearer").length;
  const approvalsCount = auditLogs.filter((l) => l.action.toLowerCase().includes("approved")).length;
  const rejectionsCount = auditLogs.filter((l) => l.action.toLowerCase().includes("rejected")).length;

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.module && log.module.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesModule = selectedModule === "All" || log.module === selectedModule;
    const matchesStatus = selectedStatus === "All" || log.status === selectedStatus;
    return matchesSearch && matchesModule && matchesStatus;
  });

  const formatValue = (val: any) => {
    if (val === null || val === undefined) return "None";
    if (typeof val === "object") return JSON.stringify(val, null, 2);
    return String(val);
  };

  return (
    <div className="space-y-6">
      {/* 5 Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-[#0D1B2A] border border-white/10">
          <span className="text-[10px] font-mono uppercase text-[#94A3B8] block mb-1">
            Total Actions
          </span>
          <span className="text-xl font-bold text-[#F8FAFC]">{totalActions}</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1B2A] border border-white/10">
          <span className="text-[10px] font-mono uppercase text-[#94A3B8] block mb-1 flex items-center gap-1">
            <Shield className="w-3 h-3 text-purple-400" /> Admin Actions
          </span>
          <span className="text-xl font-bold text-[#F8FAFC]">{adminActions}</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1B2A] border border-white/10">
          <span className="text-[10px] font-mono uppercase text-[#94A3B8] block mb-1 flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-[#22D3EE]" /> OB Actions
          </span>
          <span className="text-xl font-bold text-[#F8FAFC]">{obActions}</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1B2A] border border-white/10">
          <span className="text-[10px] font-mono uppercase text-[#94A3B8] block mb-1 text-emerald-400">
            Approvals
          </span>
          <span className="text-xl font-bold text-emerald-400">{approvalsCount}</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1B2A] border border-white/10">
          <span className="text-[10px] font-mono uppercase text-[#94A3B8] block mb-1 text-red-400">
            Rejections
          </span>
          <span className="text-xl font-bold text-red-400">{rejectionsCount}</span>
        </div>
      </div>

      {/* Filter Toolbar & Export Excel Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[#0D1B2A] border border-white/10">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search actor, action, or module..."
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#07111F] border border-white/15 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#0078D4]"
            />
          </div>

          {/* Module Filter */}
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[#07111F] border border-white/15 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#0078D4]"
          >
            <option value="All">All Modules</option>
            <option value="User Management">User Management</option>
            <option value="Responsibility Management">Responsibility Management</option>
            <option value="Approval Workflow">Approval Workflow</option>
            <option value="Placement Questions">Placement Questions</option>
            <option value="General Quiz">General Quiz</option>
            <option value="Feed Community">Feed Community</option>
            <option value="Announcements">Announcements</option>
            <option value="Authentication">Authentication</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 px-3 rounded-lg bg-[#07111F] border border-white/15 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#0078D4]"
          >
            <option value="All">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Warning">Warning</option>
            <option value="Failure">Failure</option>
          </select>
        </div>

        {/* Excel Export Button */}
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="w-4 h-4 text-[#22D3EE]" />}
          onClick={exportAuditLogsToCSV}
        >
          Export Excel
        </Button>
      </div>

      {/* Log Data Table */}
      <div className="rounded-2xl bg-[#0D1B2A] border border-white/10 overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#CBD5E1]">
            <thead className="bg-[#07111F] text-xs font-mono uppercase tracking-wider text-[#94A3B8] border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Module</th>
                <th className="px-6 py-4 text-center">Changes / Details</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#94A3B8] font-sans">
                    No log records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const hasDetails = Boolean(
                    log.originalValue || log.modifiedValue || log.reason || log.targetId || (log.metadata && Object.keys(log.metadata).length > 0)
                  );

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 text-[#94A3B8] whitespace-nowrap">
                        {log.timestamp}
                      </td>

                      <td className="px-6 py-4 font-sans font-bold text-[#F8FAFC] whitespace-nowrap">
                        {log.actor}
                      </td>

                      <td className="px-6 py-4 text-[#CBD5E1] whitespace-nowrap">
                        {log.role}
                      </td>

                      <td className="px-6 py-4 font-sans font-medium text-[#F8FAFC]">
                        {log.action}
                      </td>

                      <td className="px-6 py-4 text-[#22D3EE] whitespace-nowrap">
                        {log.module}
                      </td>

                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {hasDetails ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-sans font-semibold bg-[#0078D4]/10 text-[#22D3EE] border border-[#0078D4]/30 hover:bg-[#0078D4]/20 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Details</span>
                          </button>
                        ) : (
                          <span className="text-[#64748B] text-[11px] font-sans">—</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right font-sans whitespace-nowrap">
                        {log.status === "Success" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Success
                          </span>
                        )}
                        {log.status === "Warning" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Warning
                          </span>
                        )}
                        {log.status === "Failure" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                            Failure
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expandable Audit Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-[#0078D4]/10 text-[#22D3EE] border border-[#0078D4]/20">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">Audit Entry Details</h3>
                  <span className="text-xs text-[#94A3B8] font-mono">{selectedLog.timestamp}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Primary Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#07111F] border border-white/5 space-y-1">
                <span className="text-[#94A3B8] uppercase text-[10px] block font-mono">Actor</span>
                <span className="font-bold text-[#F8FAFC] block truncate">{selectedLog.actor}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#07111F] border border-white/5 space-y-1">
                <span className="text-[#94A3B8] uppercase text-[10px] block font-mono">Role</span>
                <span className="font-semibold text-[#CBD5E1] block">{selectedLog.role}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#07111F] border border-white/5 space-y-1">
                <span className="text-[#94A3B8] uppercase text-[10px] block font-mono">Module</span>
                <span className="font-semibold text-[#22D3EE] block truncate">{selectedLog.module}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#07111F] border border-white/5 space-y-1">
                <span className="text-[#94A3B8] uppercase text-[10px] block font-mono">Target ID</span>
                <span className="font-mono text-[#94A3B8] block truncate">{selectedLog.targetId || "—"}</span>
              </div>
            </div>

            {/* Action & Reason */}
            <div className="p-4 rounded-xl bg-[#07111F] border border-white/5 space-y-2 text-xs">
              <div>
                <span className="text-[#94A3B8] uppercase text-[10px] font-mono block mb-0.5">Action</span>
                <span className="font-semibold text-[#F8FAFC] text-sm">{selectedLog.action}</span>
              </div>
              {selectedLog.reason && (
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[#94A3B8] uppercase text-[10px] font-mono block mb-0.5">Reason / Comment</span>
                  <p className="text-amber-300 font-medium leading-relaxed">{selectedLog.reason}</p>
                </div>
              )}
            </div>

            {/* Original vs Modified Values (Diff Comparison) */}
            {(selectedLog.originalValue || selectedLog.modifiedValue) && (
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase font-bold text-[#22D3EE] tracking-wider block">
                  State Mutation (Before → After)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Original Value (Before) */}
                  <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 space-y-1.5">
                    <span className="text-[11px] font-bold text-red-400 uppercase font-mono block">
                      Before (Original Value)
                    </span>
                    <pre className="text-[11px] font-mono text-[#CBD5E1] bg-black/30 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
                      {formatValue(selectedLog.originalValue)}
                    </pre>
                  </div>

                  {/* Modified Value (After) */}
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase font-mono block">
                      After (Modified Value)
                    </span>
                    <pre className="text-[11px] font-mono text-[#CBD5E1] bg-black/30 p-2.5 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
                      {formatValue(selectedLog.modifiedValue)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Metadata */}
            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="text-[11px] font-mono uppercase text-[#94A3B8] font-semibold block">
                  Context Metadata
                </span>
                <pre className="text-[11px] font-mono text-[#94A3B8] bg-[#07111F] p-3 rounded-xl border border-white/5 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

