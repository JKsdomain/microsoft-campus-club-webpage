import React from "react";
import { AuditLogTable } from "@/components/admin/AuditLogTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit & Logs — MCC Admin Panel",
  description: "Monitor platform activity, admin operations, and export audit trails.",
};

export default function AuditLogsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Description */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
          Audit & Logs
        </h2>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Monitor important activity across the MCC platform.
        </p>
      </div>

      {/* Audit Log Table & Exporter */}
      <AuditLogTable />
    </div>
  );
}
