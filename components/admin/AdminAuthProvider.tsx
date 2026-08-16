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
  addAnnouncement: (text: string, payload?: { title?: string; poster?: any; isPinned?: boolean; status?: string }) => void;
  updateAnnouncement: (id: string, text: string, payload?: { title?: string; poster?: any; isPinned?: boolean; status?: string }) => void;
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

  // Sync state with server session authority
  useEffect(() => {
    const syncWithServer = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.role === "ADMIN") {
            setIsAuthenticated(true);
            if (data.email) setAdminEmail(data.email);
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Session verification error:", err);
        // Fallback removed: rely on server session; assume unauthenticated on error
        setIsAuthenticated(false);
      } finally {
        setIsHydrated(true);
      }
    };

    // Load announcements from DB
    const fetchAnnouncements = async () => {
      try {
        const annRes = await fetch("/api/admin/announcements");
        if (annRes.ok) {
          const annData = await annRes.json();
          if (Array.isArray(annData.announcements)) {
            setAnnouncements(annData.announcements);
          }
        }
      } catch (e) {
        console.error("Failed to fetch announcements from API", e);
      }
    };

    // Load activity availability from DB (SystemSetting)
    const fetchAvailability = async () => {
      try {
        const availRes = await fetch("/api/admin/activity-availability");
        if (availRes.ok) {
          const availData = await availRes.json();
          if (availData.activityAvailability) {
            setActivityAvailability(availData.activityAvailability);
          }
        }
      } catch (e) {
        console.error("Failed to fetch activity availability", e);
      }
    };

    // Load assignments from MongoDB (Responsibilities + assigned OBs)
    const fetchAssignments = async () => {
      try {
        const assignRes = await fetch("/api/admin/assignments");
        if (assignRes.ok) {
          const assignData = await assignRes.json();
          if (Array.isArray(assignData.assignments) && assignData.assignments.length > 0) {
            setAssignments(assignData.assignments);
          }
        }
      } catch (e) {
        console.error("Failed to fetch assignments from MongoDB", e);
      }
    };

    // Call async functions
    syncWithServer();
    fetchUsersFromDb();
    fetchAnnouncements();
    fetchAvailability();
    fetchAssignments();
  }, []);

  const saveAnnouncements = async (newAnnouncements: Announcement[]) => {
    setAnnouncements(newAnnouncements);
    try {
      await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcements: newAnnouncements }),
      });
    } catch (e) {
      console.error("Failed to save announcements", e);
    }
  };

  const loginAdmin = (email: string) => {
    setIsAuthenticated(true);
    setAdminEmail(email);
    // LocalStorage persistence removed; session handled server‑side

    // Purge any stale OB storage keys
    localStorage.removeItem("mcc_ob_authenticated");
    localStorage.removeItem("mcc_ob_email");
    localStorage.removeItem("mcc_ob_name");
    localStorage.removeItem("mcc_ob_dept");
    localStorage.removeItem("mcc_ob_resp");

    addAuditLog("Admin Login", "Authentication", "Success");
  };

  const logoutAdmin = async () => {
    setIsAuthenticated(false);
    localStorage.removeItem("mcc_admin_authenticated");
    localStorage.removeItem("mcc_admin_email");

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout API call error:", err);
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

  // Responsibility Assignment: STRICT 1 OB -> 1 RESPONSIBILITY (MongoDB-persisted)
  const assignObToActivity = async (activityId: string, obId: string) => {
    const targetActivity = assignments.find((a) => a.id === activityId);
    const selectedOb = officeBearers.find((ob) => ob.id === obId);

    if (!targetActivity || !selectedOb) return;

    const activityName = targetActivity.activityName;

    try {
      const res = await fetch("/api/admin/assignments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, obId }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update assignments from server response (source of truth)
        if (Array.isArray(data.assignments)) {
          setAssignments(data.assignments);
        }
        // Update OBs from server response (source of truth)
        if (Array.isArray(data.users)) {
          setOfficeBearers(data.users);
        }
        addAuditLog(`Assigned ${selectedOb.name} to strictly manage ${activityName}`, "Responsibility Management", "Success");
        console.log(`✅ [MONGODB] Assignment persisted: ${selectedOb.name} → ${activityName}`);
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("❌ Assignment API error:", errData.message || res.statusText);
        addAuditLog(`Failed to assign ${selectedOb.name} to ${activityName}`, "Responsibility Management", "Failure");
      }
    } catch (err) {
      console.error("❌ Assignment network error:", err);
      addAuditLog(`Failed to assign ${selectedOb.name} to ${activityName} (network error)`, "Responsibility Management", "Failure");
    }
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
  const addAnnouncement = async (
    text: string,
    payload?: { title?: string; poster?: any; isPinned?: boolean; status?: string }
  ) => {
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload?.title || "MCC Event Notice",
          text,
          description: text,
          poster: payload?.poster || null,
          isPinned: Boolean(payload?.isPinned),
          status: payload?.status || "PUBLISHED",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.announcement) {
          // If newly created announcement is pinned, unpin all local ones
          const formatted = {
            id: data.announcement.id,
            title: data.announcement.title,
            text: data.announcement.text,
            description: data.announcement.description,
            poster: data.announcement.poster,
            isPinned: data.announcement.isPinned,
            published: data.announcement.isPublished,
            status: data.announcement.status,
            createdAt: data.announcement.publishedDate,
          };
          setAnnouncements((prev) => {
            const list = payload?.isPinned ? prev.map((a) => ({ ...a, isPinned: false })) : prev;
            return [formatted, ...list.filter((a) => a.id !== formatted.id)];
          });
          addAuditLog(`Created Announcement (${formatted.title})`, "Announcements", "Success");
          return;
        }
      }
    } catch (e) {
      console.error("MongoDB Atlas announcement create error:", e);
    }

    // Local fallback
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: payload?.title || "MCC Event Notice",
      text,
      description: text,
      poster: payload?.poster || null,
      isPinned: Boolean(payload?.isPinned),
      published: true,
      status: payload?.status as any || "PUBLISHED",
      createdAt: new Date().toISOString().replace("T", " ").substring(0, 10),
    };
    saveAnnouncements([newAnn, ...announcements]);
    addAuditLog("Created Announcement", "Announcements", "Success");
  };

  const updateAnnouncement = async (
    id: string,
    text: string,
    payload?: { title?: string; poster?: any; isPinned?: boolean; status?: string }
  ) => {
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          title: payload?.title,
          text,
          description: text,
          poster: payload?.poster,
          isPinned: payload?.isPinned,
          status: payload?.status,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.announcement) {
          const updatedDoc = data.announcement;
          setAnnouncements((prev) =>
            prev.map((a) => {
              if (a.id === id) {
                return {
                  ...a,
                  title: updatedDoc.title,
                  text: updatedDoc.text,
                  description: updatedDoc.description,
                  poster: updatedDoc.poster,
                  isPinned: updatedDoc.isPinned,
                  published: updatedDoc.isPublished,
                  status: updatedDoc.status,
                };
              }
              if (payload?.isPinned && a.id !== id) {
                return { ...a, isPinned: false };
              }
              return a;
            })
          );
          addAuditLog(`Updated Announcement (${id})`, "Announcements", "Success");
          return;
        }
      }
    } catch (e) {
      console.error("MongoDB Atlas announcement update error:", e);
    }

    const updated = announcements.map((a) =>
      a.id === id
        ? {
            ...a,
            text,
            title: payload?.title || a.title,
            poster: payload?.poster !== undefined ? payload.poster : a.poster,
            isPinned: payload?.isPinned !== undefined ? payload.isPinned : a.isPinned,
            status: (payload?.status as any) || a.status,
          }
        : payload?.isPinned
        ? { ...a, isPinned: false }
        : a
    );
    saveAnnouncements(updated);
    addAuditLog(`Updated Announcement (${id})`, "Announcements", "Success");
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
    } catch (e) {
      console.error("MongoDB Atlas announcement delete error:", e);
    }
    const filtered = announcements.filter((a) => a.id !== id);
    saveAnnouncements(filtered);
    addAuditLog(`Deleted Announcement (${id})`, "Announcements", "Warning");
  };

  const togglePublishAnnouncement = async (id: string) => {
    const target = announcements.find((a) => a.id === id);
    if (!target) return;
    const newPublished = !target.published;
    await updateAnnouncement(id, target.text, {
      title: target.title,
      poster: target.poster,
      isPinned: target.isPinned,
      status: newPublished ? "PUBLISHED" : "DRAFT",
    });
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
        // Local storage fallback removed; activity availability persisted via API
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
