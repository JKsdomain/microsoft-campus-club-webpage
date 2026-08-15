export interface OfficeBearer {
  id: string;
  name: string;
  email: string;
  department: string;
  responsibility: string;
  status: "Active" | "Inactive";
  joinedDate: string;
}

export interface ActivityAssignment {
  id: string;
  activityName: string;
  assignedObId: string | null;
  assignedObName: string | null;
  department: string | null;
  assignmentStatus: "Assigned" | "Unassigned";
}

export interface Proposal {
  id: string;
  type: "Feed Community" | "General Quiz" | "Placement Questions";
  title: string;
  submittedBy: string;
  submittedDate: string;
  status: "Pending" | "Approved" | "Rejected";
  details: string;
}

export interface AnnouncementPoster {
  url: string;
  publicId?: string;
  type?: string;
}

export interface Announcement {
  id: string;
  title?: string;
  text: string;
  description?: string;
  poster?: AnnouncementPoster | null;
  isPinned?: boolean;
  published: boolean;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  module: string;
  status: "Success" | "Warning" | "Failure";
}

export type ActivityAvailabilityStatus = "OPEN" | "CLOSED" | "COMING SOON";

export interface ActivityAvailabilityMap {
  [activityName: string]: ActivityAvailabilityStatus;
}

export const INITIAL_ACTIVITY_AVAILABILITY: ActivityAvailabilityMap = {
  "Placement Questions": "OPEN",
  "General Quiz": "OPEN",
  "Technical Games": "COMING SOON",
};

// Clean initial state (No fake testing records)
export const INITIAL_OFFICE_BEARERS: OfficeBearer[] = [];

export const INITIAL_ASSIGNMENTS: ActivityAssignment[] = [
  {
    id: "act-1",
    activityName: "Placement Questions",
    assignedObId: null,
    assignedObName: null,
    department: null,
    assignmentStatus: "Unassigned",
  },
  {
    id: "act-2",
    activityName: "General Quiz",
    assignedObId: null,
    assignedObName: null,
    department: null,
    assignmentStatus: "Unassigned",
  },
  {
    id: "act-3",
    activityName: "Technical Games",
    assignedObId: null,
    assignedObName: null,
    department: null,
    assignmentStatus: "Unassigned",
  },
  {
    id: "act-4",
    activityName: "Feed Community",
    assignedObId: null,
    assignedObName: null,
    department: null,
    assignmentStatus: "Unassigned",
  },
];

export const INITIAL_PROPOSALS: Proposal[] = [];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
