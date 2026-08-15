"use client";

import React, { useState } from "react";
import { Plus, MoreVertical, Edit2, KeyRound, UserX, AlertTriangle } from "lucide-react";
import { OfficeBearer } from "@/lib/adminState";
import { useAdminAuth } from "./AdminAuthProvider";
import { Button } from "../ui/Button";
import { UserFormModal } from "./UserFormModal";
import { CredentialDialog } from "./CredentialDialog";

export const UserManagementTable: React.FC = () => {
  const {
    officeBearers,
    addOfficeBearer,
    updateOfficeBearer,
    deleteOfficeBearer,
    changeObCredentials,
  } = useAdminAuth();

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingOb, setEditingOb] = useState<OfficeBearer | null>(null);

  const [credDialogOpen, setCredDialogOpen] = useState(false);
  const [credTargetOb, setCredTargetOb] = useState<OfficeBearer | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingOb(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (ob: OfficeBearer) => {
    setEditingOb(ob);
    setFormModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleOpenCred = (ob: OfficeBearer) => {
    setCredTargetOb(ob);
    setCredDialogOpen(true);
    setOpenDropdownId(null);
  };

  const handleSaveOb = (obData: {
    name: string;
    email: string;
    department: string;
    responsibility: string;
    status: "Active" | "Inactive";
  }) => {
    if (editingOb) {
      updateOfficeBearer(editingOb.id, obData);
    } else {
      addOfficeBearer(obData);
    }
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteId) {
      deleteOfficeBearer(confirmDeleteId);
      setConfirmDeleteId(null);
      setOpenDropdownId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#F8FAFC]">
            Office Bearer Roster ({officeBearers.length})
          </h3>
          <p className="text-xs text-[#94A3B8]">
            Manage credentials, department assignments, and active statuses.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          Add Office Bearer
        </Button>
      </div>

      {/* Office Bearers Data Table */}
      <div className="rounded-2xl bg-[#0D1B2A] border border-white/10 overflow-hidden shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#CBD5E1]">
            <thead className="bg-[#07111F] text-xs font-mono uppercase tracking-wider text-[#94A3B8] border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Responsibility</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {officeBearers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#94A3B8]">
                    No Office Bearers found. Click &quot;Add Office Bearer&quot; to get started.
                  </td>
                </tr>
              ) : (
                officeBearers.map((ob) => (
                  <tr
                    key={ob.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Name & Email */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#F8FAFC] group-hover:text-white">
                          {ob.name}
                        </span>
                        <span className="text-xs text-[#94A3B8] font-mono">
                          {ob.email}
                        </span>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-6 py-4 text-xs font-medium text-[#CBD5E1]">
                      {ob.department}
                    </td>

                    {/* Responsibility */}
                    <td className="px-6 py-4">
                      <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[#F8FAFC]">
                        {ob.responsibility}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {ob.status === "Active" ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions Dropdown */}
                    <td className="px-6 py-4 text-right relative">
                      <div className="inline-block text-left">
                        <button
                          onClick={() =>
                            setOpenDropdownId(
                              openDropdownId === ob.id ? null : ob.id
                            )
                          }
                          className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {openDropdownId === ob.id && (
                          <div className="absolute right-6 top-12 z-30 w-48 rounded-xl bg-[#122438] border border-white/15 shadow-2xl p-1.5 space-y-1 animate-fade-in">
                            <button
                              onClick={() => handleOpenEdit(ob)}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-lg text-[#CBD5E1] hover:text-white hover:bg-white/10"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#0078D4]" />
                              <span>Edit Office Bearer</span>
                            </button>

                            <button
                              onClick={() => handleOpenCred(ob)}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-lg text-[#CBD5E1] hover:text-white hover:bg-white/10"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                              <span>Change Credentials</span>
                            </button>

                            <button
                              onClick={() => {
                                setConfirmDeleteId(ob.id);
                                setOpenDropdownId(null);
                              }}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-lg text-red-400 hover:bg-red-500/10"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Deactivate / Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Form Modal (Add / Edit) */}
      <UserFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSave={handleSaveOb}
        initialData={editingOb}
      />

      {/* Change Credentials Dialog */}
      <CredentialDialog
        isOpen={credDialogOpen}
        ob={credTargetOb}
        onClose={() => setCredDialogOpen(false)}
        onConfirm={changeObCredentials}
      />

      {/* Delete / Deactivate Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#0D1B2A] border border-white/15 p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-bold text-[#F8FAFC]">
              Deactivate this Office Bearer?
            </h4>
            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              This action will revoke authentication access for this Office Bearer account across the MCC platform.
            </p>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleConfirmDelete}
              >
                Confirm Deactivate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
