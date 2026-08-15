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
  isHydrated: boolean;
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
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [adminName] = useState<string>("Administrator");
  const [adminEmail, setAdminEmail] = useState<string>("admin@mcc.edu");

  const [officeBearers, setOfficeBearers] = useState<OfficeBearer[]>(INITIAL_OFFICE_BEARERS);
  const [assignments, setAssignments] = useState<ActivityAssignment[]>(INITIAL_ASSIGNMENTS);
  const [proposals, setProposals] = useState<Proposal[]>(INITIAL_PROPOSALS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [activityAvailability, setActivityAvailability] = useState<ActivityAvailabilityMap>(INITIAL_ACTIVITY_AVAILABILITY);

  const fetchUsersFromDb = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.users)) {
          setOfficeBearers(data.users);
        }
      }
    } catch (err) {
      console.error("Failed to fetch users from MongoDB Atlas:", err);
    }
  };

  // Sync state with localStorage and cookies if in browser environment
  useEffect(() => {
    const savedAuth = localStorage.getItem("mcc_admin_authenticated");
    const hasCookie = typeof document !== "undefined" && document.cookie.includes("mcc_admin_session");
    if (savedAuth === "true" || hasCookie) {
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
    setIsHydrated(true);

    // Fetch real MongoDB data
    fetchUsersFromDb();
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
    if (typeof document !== "undefined") {
      document.cookie = `mcc_admin_session=${encodeURIComponent(email)}; path=/; max-age=86400; SameSite=Lax`;
    }
    addAuditLog("Admin Login", "Authentication", "Success");
  };

  const logoutAdmin = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("mcc_admin_authenticated");
    localStorage.removeItem("mcc_admin_email");
    if (typeof document !== "undefined") {
      document.cookie = "mcc_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
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

  // User Management MongoDB CRUD
  const addOfficeBearer = async (obData: Omit<OfficeBearer, "id" | "joinedDate">) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(obData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setOfficeBearers((prev) => [data.user, ...prev.filter((u) => u.id !== data.user.id)]);
          addAuditLog(`Created Office Bearer (${data.user.name})`, "User Management", "Success");
          return;
        }
      }
    } catch (err) {
      console.error("MongoDB Atlas creation error:", err);
    }

    // Fallback UI update
    const newOb: OfficeBearer = {
      ...obData,
      id: `ob-${Date.now()}`,
      joinedDate: new Date().toISOString().split("T")[0],
    };
    setOfficeBearers((prev) => [...prev, newOb]);
    addAuditLog(`Created Office Bearer (${newOb.name})`, "User Management", "Success");
  };

  const updateOfficeBearer = async (id: string, updatedData: Partial<OfficeBearer>) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updatedData }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setOfficeBearers((prev) => prev.map((ob) => (ob.id === id ? data.user : ob)));
          addAuditLog(`Updated Office Bearer (${data.user.name})`, "User Management", "Success");
          return;
        }
      }
    } catch (err) {
      console.error("MongoDB Atlas update error:", err);
    }

    setOfficeBearers((prev) =>
      prev.map((ob) => (ob.id === id ? { ...ob, ...updatedData } : ob))
    );
    addAuditLog(`Updated Office Bearer (${id})`, "User Management", "Success");
  };

  const deleteOfficeBearer = async (id: string) => {
    try {
      await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch (err) {
      console.error("MongoDB Atlas delete error:", err);
    }
    const target = officeBearers.find((ob) => ob.id === id);
    setOfficeBearers((prev) => prev.filter((ob) => ob.id !== id));
    addAuditLog(`Deactivated/Deleted Office Bearer (${target?.name || id})`, "User Management", "Warning");
  };

  const changeObCredentials = async (id: string) => {
    try {
      await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, newPassword: "ob123_reset" }),
      });
    } catch (err) {
      console.error("MongoDB Atlas credentials update error:", err);
    }
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
        isHydrated,
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
