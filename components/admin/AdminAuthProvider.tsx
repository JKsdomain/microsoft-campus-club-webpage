"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  OfficeBearer,
  ActivityAssignment,
  Proposal,
  Announcement,
  AuditLog,
  ActivityAvailabilityStatus,
  ActivityAvailabilityMap,
  INITIAL_OFFICE_BEARERS,
  INITIAL_ASSIGNMENTS,
  INITIAL_PROPOSALS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ACTIVITY_AVAILABILITY,
} from "@/lib/adminState";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  adminName: string;
  adminEmail: string;
  loginAdmin: (email: string) => void;
  logoutAdmin: () => void;

  officeBearers: OfficeBearer[];
  addOfficeBearer: (ob: Omit<OfficeBearer, "id" | "joinedDate">) => void;
  updateOfficeBearer: (id: string, ob: Partial<OfficeBearer>) => void;
  deleteOfficeBearer: (id: string) => void;
  changeObCredentials: (id: string) => void;

  assignments: ActivityAssignment[];
  assignObToActivity: (activityId: string, obId: string) => void;

  proposals: Proposal[];
  approveProposal: (id: string) => void;
  rejectProposal: (id: string) => void;

  announcements: Announcement[];
  addAnnouncement: (text: string) => void;
  updateAnnouncement: (id: string, text: string) => void;
  deleteAnnouncement: (id: string) => void;
  togglePublishAnnouncement: (id: string) => void;
  publishedAnnouncement: Announcement | null;

  auditLogs: AuditLog[];
  addAuditLog: (action: string, module: string, status?: "Success" | "Warning" | "Failure") => void;
  exportAuditLogsToCSV: () => void;

  activityAvailability: ActivityAvailabilityMap;
  updateActivityAvailability: (activityName: string, status: ActivityAvailabilityStatus) => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminName] = useState<string>("Administrator");
  const [adminEmail, setAdminEmail] = useState<string>("admin@mcc.edu");

  const [officeBearers, setOfficeBearers] = useState<OfficeBearer[]>(INITIAL_OFFICE_BEARERS);
  const [assignments, setAssignments] = useState<ActivityAssignment[]>(INITIAL_ASSIGNMENTS);
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [activityAvailability, setActivityAvailability] = useState<ActivityAvailabilityMap>(INITIAL_ACTIVITY_AVAILABILITY);

  // Sync state with localStorage if in browser environment
  useEffect(() => {
    const savedAuth = localStorage.getItem("mcc_admin_authenticated");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    const savedEmail = localStorage.getItem("mcc_admin_email");
    if (savedEmail) {
      setAdminEmail(savedEmail);
    }
    const savedAnnouncements = localStorage.getItem("mcc_announcements");
    if (savedAnnouncements) {
      try {
        setAnnouncements(JSON.parse(savedAnnouncements));
      } catch (e) {
        console.error("Failed to parse saved announcements", e);
      }
    }
    const savedAvailability = localStorage.getItem("mcc_activity_availability");
    if (savedAvailability) {
      try {
        setActivityAvailability(JSON.parse(savedAvailability));
      } catch (e) {
        console.error("Failed to parse activity availability", e);
      }
    }
  }, []);

  const saveAnnouncements = (newAnnouncements: Announcement[]) => {
    setAnnouncements(newAnnouncements);
    try {
      localStorage.setItem("mcc_announcements", JSON.stringify(newAnnouncements));
    } catch (e) {
      console.error("Failed to save announcements", e);
    }
  };

  const loginAdmin = (email: string) => {
    setIsAuthenticated(true);
    setAdminEmail(email);
    localStorage.setItem("mcc_admin_authenticated", "true");
    localStorage.setItem("mcc_admin_email", email);
    addAuditLog("Admin Login", "Authentication", "Success");
  };

  const logoutAdmin = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("mcc_admin_authenticated");
    localStorage.removeItem("mcc_admin_email");
    addAuditLog("Admin Logout", "Authentication", "Success");
  };

  const addAuditLog = (action: string, module: string, status: "Success" | "Warning" | "Failure" = "Success") => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      actor: adminName,
      role: "Administrator",
      action,
      module,
      status,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // User Management CRUD
  const addOfficeBearer = (obData: Omit<OfficeBearer, "id" | "joinedDate">) => {
    const newOb: OfficeBearer = {
      ...obData,
      id: `ob-${Date.now()}`,
      joinedDate: new Date().toISOString().split("T")[0],
    };
    setOfficeBearers((prev) => [...prev, newOb]);
    addAuditLog(`Created Office Bearer (${newOb.name})`, "User Management", "Success");
  };

  const updateOfficeBearer = (id: string, updatedData: Partial<OfficeBearer>) => {
    setOfficeBearers((prev) =>
      prev.map((ob) => (ob.id === id ? { ...ob, ...updatedData } : ob))
    );
    addAuditLog(`Updated Office Bearer (${id})`, "User Management", "Success");
  };

  const deleteOfficeBearer = (id: string) => {
    const target = officeBearers.find((ob) => ob.id === id);
    setOfficeBearers((prev) => prev.filter((ob) => ob.id !== id));
    addAuditLog(`Deactivated/Deleted Office Bearer (${target?.name || id})`, "User Management", "Warning");
  };

  const changeObCredentials = (id: string) => {
    const target = officeBearers.find((ob) => ob.id === id);
    addAuditLog(`Changed Credentials for (${target?.name || id})`, "User Management", "Warning");
  };

  // Responsibility Assignment: STRICT 1 OB -> 1 RESPONSIBILITY
  const assignObToActivity = (activityId: string, obId: string) => {
    const targetActivity = assignments.find((a) => a.id === activityId);
    const selectedOb = officeBearers.find((ob) => ob.id === obId);

    if (!targetActivity || !selectedOb) return;

    const activityName = targetActivity.activityName;

    // 1. Update officeBearers list: clear selectedOb's old responsibility, set new responsibility
    setOfficeBearers((prev) =>
      prev.map((ob) => {
        if (ob.id === obId) {
          return { ...ob, responsibility: activityName };
        }
        // If another OB had this activity, clear their responsibility
        if (ob.responsibility === activityName) {
          return { ...ob, responsibility: "Unassigned" };
        }
        return ob;
      })
    );

    // 2. Update assignments list: clear any other activity currently assigned to selectedOb
    setAssignments((prev) =>
      prev.map((act) => {
        if (act.id === activityId) {
          return {
            ...act,
            assignedObId: selectedOb.id,
            assignedObName: selectedOb.name,
            department: selectedOb.department,
            assignmentStatus: "Assigned",
          };
        }
        if (act.assignedObId === obId) {
          return {
            ...act,
            assignedObId: null,
            assignedObName: null,
            department: null,
            assignmentStatus: "Unassigned",
          };
        }
        return act;
      })
    );

    addAuditLog(`Assigned ${selectedOb.name} to strictly manage ${activityName}`, "Responsibility Management", "Success");
  };

  // Proposal Workflow
  const approveProposal = (id: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "Approved" } : p))
    );
    const target = proposals.find((p) => p.id === id);
    addAuditLog(`Approved Proposal (${target?.title})`, "Approval Workflow", "Success");
  };

  const rejectProposal = (id: string) => {
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "Rejected" } : p))
    );
    const target = proposals.find((p) => p.id === id);
    addAuditLog(`Rejected Proposal (${target?.title})`, "Approval Workflow", "Warning");
  };

  // Announcement Management
  const addAnnouncement = (text: string) => {
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      text,
      published: true, // Auto publish new announcement
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      updatedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
    };
    saveAnnouncements([newAnn, ...announcements]);
    addAuditLog("Created & Published Announcement", "Announcements", "Success");
  };

  const updateAnnouncement = (id: string, text: string) => {
    const updated = announcements.map((a) =>
      a.id === id
        ? {
            ...a,
            text,
            updatedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
          }
        : a
    );
    saveAnnouncements(updated);
    addAuditLog(`Updated Announcement (${id})`, "Announcements", "Success");
  };

  const deleteAnnouncement = (id: string) => {
    const filtered = announcements.filter((a) => a.id !== id);
    saveAnnouncements(filtered);
    addAuditLog(`Deleted Announcement (${id})`, "Announcements", "Warning");
  };

  const togglePublishAnnouncement = (id: string) => {
    const updated = announcements.map((a) =>
      a.id === id ? { ...a, published: !a.published } : a
    );
    saveAnnouncements(updated);
    addAuditLog(`Toggled Announcement Publish State`, "Announcements", "Success");
  };

  const publishedAnnouncement = announcements.find((a) => a.published) || null;

  // Excel / CSV Export
  const exportAuditLogsToCSV = () => {
    const headers = ["Timestamp", "Actor", "Role", "Action", "Module", "Status"];
    const rows = auditLogs.map((log) => [
      `"${log.timestamp}"`,
      `"${log.actor}"`,
      `"${log.role}"`,
      `"${log.action}"`,
      `"${log.module}"`,
      `"${log.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mcc_audit_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    addAuditLog("Exported Audit Logs to Excel/CSV", "Audit & Logs", "Success");
  };

  // Activity Availability Control
  const updateActivityAvailability = (activityName: string, status: ActivityAvailabilityStatus) => {
    const oldStatus = activityAvailability[activityName] || "OPEN";
    const updated = {
      ...activityAvailability,
      [activityName]: status,
    };
    setActivityAvailability(updated);
    try {
      localStorage.setItem("mcc_activity_availability", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save activity availability", e);
    }
    addAuditLog(`Changed ${activityName} availability: ${oldStatus} → ${status}`, "Responsibilities", "Success");
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        adminName,
        adminEmail,
        loginAdmin,
        logoutAdmin,
        officeBearers,
        addOfficeBearer,
        updateOfficeBearer,
        deleteOfficeBearer,
        changeObCredentials,
        assignments,
        assignObToActivity,
        proposals,
        approveProposal,
        rejectProposal,
        announcements,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        togglePublishAnnouncement,
        publishedAnnouncement,
        auditLogs,
        addAuditLog,
        exportAuditLogsToCSV,
        activityAvailability,
        updateActivityAvailability,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
