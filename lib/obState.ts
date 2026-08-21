export interface OBProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  // STRICT RULE: ONE Office Bearer -> ONE Responsibility
  assignedResponsibility: "Placement Questions" | "General Quiz" | "Technical Games" | "Feed Community" | "Unassigned";
}

export interface QuizSubmission {
  id: string;
  type: "General Quiz" | "Placement Questions";
  title: string;
  questionsToUpload: number;
  questionsToDisplay: number;
  randomQuestions: boolean;
  randomChoices: boolean;
  timerMinutes: number;
  submittedBy: string;
  submittedDate: string;
  status: "Pending Approval" | "Approved" | "Rejected" | "Pending Re-Approval" | "Archived";
  questionsDetected: number;
  csvFileName: string;
  rejectionReason?: string;
  revisionNumber?: number;
  parentId?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  questions?: any[];
}

export interface FeedPostItem {
  id: string;
  authorName: string;
  authorDepartment: string;
  timestamp: string;
  content: string;
  mediaType: "none" | "image" | "video";
  mediaUrl?: string;
  mediaPublicId?: string;
  status: "Pending Approval" | "Approved" | "Rejected" | "Pending Re-Approval" | "Archived";
  likesCount: number;
  dislikesCount: number;
  userVote?: "like" | "dislike" | null;
  revisionNumber?: number;
  parentId?: string | null;
}

// Clean preset OBs list (No hardcoded preset accounts)
export const PRESET_OBS: OBProfile[] = [];

// Clean initial state (No fake testing submissions or posts)
export const INITIAL_SUBMISSIONS: QuizSubmission[] = [];

export const INITIAL_FEED_POSTS: FeedPostItem[] = [];
