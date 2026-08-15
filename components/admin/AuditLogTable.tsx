"use client";

import React, { useState } from "react";
import { Download, FileClock, Search, Shield, UserCheck } from "lucide-react";
import { useAdminAuth } from "./AdminAuthProvider";
import { Button } from "../ui/Button";

export const AuditLogTable: React.FC = () => {
  const { auditLogs, exportAuditLogsToCSV } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const totalActions = auditLogs.length;
  const adminActions = auditLogs.filter((l) => l.role === "Administrator").length;
  const obActions = auditLogs.filter((l) => l.role === "Office Bearer").length;
  const approvalsCount = auditLogs.filter((l) => l.action.toLowerCase().includes("approved")).length;
  const rejectionsCount = auditLogs.filter((l) => l.action.toLowerCase().includes("rejected")).length;

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === "All" || log.module === selectedModule;
    const matchesStatus = selectedStatus === "All" || log.status === selectedStatus;
    return matchesSearch && matchesModule && matchesStatus;
  });

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
              placeholder="Search actor or action..."
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
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[#94A3B8] font-sans">
                    No log records match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 text-[#94A3B8]">
                      {log.timestamp}
                    </td>

                    <td className="px-6 py-4 font-sans font-bold text-[#F8FAFC]">
                      {log.actor}
                    </td>

                    <td className="px-6 py-4 text-[#CBD5E1]">
                      {log.role}
                    </td>

                    <td className="px-6 py-4 font-sans font-medium text-[#F8FAFC]">
                      {log.action}
                    </td>

                    <td className="px-6 py-4 text-[#22D3EE]">
                      {log.module}
                    </td>

                    <td className="px-6 py-4 text-right font-sans">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
