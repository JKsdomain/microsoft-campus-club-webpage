import React from "react";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management — MCC Admin Panel",
  description: "Manage MCC Office Bearer accounts and access credentials.",
};

export default function UserManagementPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Description */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
          User Management
        </h2>
        <p className="text-sm text-[#CBD5E1] mt-1">
          Manage MCC Office Bearers and their account access.
        </p>
      </div>

      {/* Main Roster Table */}
      <UserManagementTable />
    </div>
  );
}
