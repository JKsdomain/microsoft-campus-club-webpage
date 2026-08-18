"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  OBProfile,
  QuizSubmission,
  FeedPostItem,
  PRESET_OBS,
  INITIAL_SUBMISSIONS,
  INITIAL_FEED_POSTS,
} from "@/lib/obState";

interface OBAuthContextType {
  isAuthenticated: boolean;
  isHydrated: boolean;
  currentOb: OBProfile;
  loginOb: (email: string, obData?: Partial<OBProfile>) => void;
  logoutOb: () => void;
  switchObPersona: (obId: string) => void;
  hasResponsibility: (activityName: "Placement Questions" | "General Quiz" | "Technical Games" | "Feed Community") => boolean;

  submissions: QuizSubmission[];
  submitQuizProposal: (submission: Omit<QuizSubmission, "id" | "submittedBy" | "submittedDate" | "status">) => Promise<void>;

  feedPosts: FeedPostItem[];
  submitFeedPost: (content: string, mediaType?: "none" | "image" | "video", mediaUrl?: string, mediaPublicId?: string) => Promise<void>;
  toggleFeedVote: (postId: string, vote: "like" | "dislike") => void;
  publishedFeedPosts: FeedPostItem[];

  submitRevision: (parentId: string, changes: Record<string, any>, revisionComment?: string) => Promise<boolean>;
  extendDeadline: (activityId: string, endAt: string | Date, startAt?: string | Date) => Promise<boolean>;
  refreshProposals: () => Promise<void>;
}

const OBAuthContext = createContext<OBAuthContextType | undefined>(undefined);

const EMPTY_OB: OBProfile = {
  id: "ob-unassigned",
  name: "Office Bearer",
  email: "",
  department: "General",
  assignedResponsibility: "Unassigned",
};

export const OBAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [currentOb, setCurrentOb] = useState<OBProfile>(EMPTY_OB);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>(INITIAL_SUBMISSIONS);
  const [feedPosts, setFeedPosts] = useState<FeedPostItem[]>(INITIAL_FEED_POSTS);

  // Load submissions & feed proposals from MongoDB
  const fetchProposalsData = async () => {
    try {
      const res = await fetch("/api/admin/proposals");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.proposals)) {
          // 1. Map Quiz & Placement proposals (exclude Archived from active list but include for history)
          const mappedQuiz: QuizSubmission[] = data.proposals
            .filter((p: any) => p.type === "General Quiz" || p.type === "Placement Questions" || p.type === "Technical Games")
            .map((p: any) => ({
              id: p.id,
              type: p.type === "Technical Games" ? "General Quiz" as const : p.type,
              title: p.title,
              questionsToUpload: p.questionsToUpload || 0,
              questionsToDisplay: p.questionsToDisplay || 0,
              randomQuestions: p.randomQuestions || false,
              randomChoices: p.randomChoices || false,
              timerMinutes: p.timerMinutes || 30,
              submittedBy: p.submittedBy,
              submittedDate: p.submittedDate,
              status: p.status === "Pending" ? "Pending Approval" : p.status === "Pending Re-Approval" ? "Pending Re-Approval" : p.status,
              questionsDetected: p.questionsDetected || 0,
              csvFileName: p.csvFileName || "",
              revisionNumber: p.revisionNumber || 0,
              parentId: p.parentId || null,
              startAt: p.startAt || null,
              endAt: p.endAt || null,
            }));
          setSubmissions(mappedQuiz);

          // 2. Map Feed Community proposals
          const mappedFeed: FeedPostItem[] = data.proposals
            .filter((p: any) => p.type === "Feed Community")
            .map((p: any) => ({
              id: p.id,
              authorName: p.submittedBy,
              authorDepartment: p.authorDepartment || "Computer Science & Engineering",
              timestamp: p.submittedDate,
              content: p.details || p.title || "",
              mediaType: (p.mediaType === "IMAGE" || p.mediaType === "image") ? "image" : (p.mediaType === "VIDEO" || p.mediaType === "video") ? "video" : "none",
              mediaUrl: p.mediaUrl || undefined,
              mediaPublicId: p.mediaPublicId || undefined,
              status: p.status === "Pending" ? "Pending Approval" : p.status === "Pending Re-Approval" ? "Pending Re-Approval" : p.status,
              likesCount: p.likesCount || 0,
              dislikesCount: p.dislikesCount || 0,
              revisionNumber: p.revisionNumber || 0,
              parentId: p.parentId || null,
            }));
          setFeedPosts(mappedFeed);
        }
      }
    } catch (e) {
      console.error("Failed to fetch proposals from MongoDB", e);
    }
  };

  useEffect(() => {
    const syncWithServer = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.role === "OFFICE_BEARER" && data.user) {
            setIsAuthenticated(true);
            const userObj = data.user;
            setCurrentOb({
              id: userObj.id || "ob-session",
              name: userObj.name || userObj.email?.split("@")[0] || "Office Bearer",
              email: userObj.email || "",
              department: userObj.department || "Computer Science & Engineering",
              assignedResponsibility: userObj.responsibility || "Unassigned",
            });
          } else {
            setIsAuthenticated(false);
            setCurrentOb(EMPTY_OB);
          }
        } else {
          setIsAuthenticated(false);
          setCurrentOb(EMPTY_OB);
        }
      } catch (err) {
        console.error("OB Session verification error:", err);
        setIsAuthenticated(false);
        setCurrentOb(EMPTY_OB);
      } finally {
        setIsHydrated(true);
      }
    };

    syncWithServer();
    fetchProposalsData();
  }, []);

  const loginOb = (email: string, obData?: Partial<OBProfile>) => {
    setIsAuthenticated(true);
    const newOb: OBProfile = {
      id: obData?.id || "ob-" + Date.now(),
      name: obData?.name || email.split("@")[0],
      email: email,
      department: obData?.department || "Computer Science & Engineering",
      assignedResponsibility: obData?.assignedResponsibility || "Unassigned",
    };
    setCurrentOb(newOb);
  };

  const logoutOb = async () => {
    setIsAuthenticated(false);
    setCurrentOb(EMPTY_OB);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout API call error:", err);
    }
  };

  const switchObPersona = (obId: string) => {
    const match = PRESET_OBS.find((ob) => ob.id === obId);
    if (match) {
      setCurrentOb(match);
    }
  };

  const hasResponsibility = (
    activityName: "Placement Questions" | "General Quiz" | "Technical Games" | "Feed Community"
  ): boolean => {
    // STRICT RULE: EXACTLY ONE RESPONSIBILITY
    return currentOb.assignedResponsibility === activityName;
  };

  const submitQuizProposal = async (
    data: Omit<QuizSubmission, "id" | "submittedBy" | "submittedDate" | "status">
  ) => {
    try {
      const res = await fetch("/api/admin/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: data.type,
          title: data.title,
          submittedBy: currentOb.name,
          authorDepartment: currentOb.department,
          questionsToUpload: data.questionsToUpload,
          questionsToDisplay: data.questionsToDisplay,
          randomQuestions: data.randomQuestions,
          randomChoices: data.randomChoices,
          timerMinutes: data.timerMinutes,
          questionsDetected: data.questionsDetected,
          csvFileName: data.csvFileName,
          startAt: data.startAt,
          endAt: data.endAt,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.proposal) {
          const newSub: QuizSubmission = {
            id: result.proposal.id,
            type: data.type,
            title: data.title || `${data.type} Submission`,
            questionsToUpload: data.questionsToUpload,
            questionsToDisplay: data.questionsToDisplay,
            randomQuestions: data.randomQuestions,
            randomChoices: data.randomChoices,
            timerMinutes: data.timerMinutes,
            submittedBy: currentOb.name,
            submittedDate: result.proposal.submittedDate,
            status: "Pending Approval",
            questionsDetected: data.questionsDetected,
            csvFileName: data.csvFileName,
            startAt: result.proposal.startAt || data.startAt,
            endAt: result.proposal.endAt || data.endAt,
          };
          setSubmissions((prev) => [newSub, ...prev]);
          console.log(`✅ [MONGODB] Quiz Proposal submitted: ${result.proposal.id}`);
        }
      } else {
        console.error("❌ Failed to submit quiz proposal to MongoDB");
      }
    } catch (err) {
      console.error("❌ Quiz Proposal submission network error:", err);
    }
  };

  const submitFeedPost = async (
    content: string,
    mediaType: "none" | "image" | "video" = "none",
    mediaUrl?: string,
    mediaPublicId?: string
  ) => {
    try {
      const res = await fetch("/api/admin/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Feed Community",
          title: content.length > 50 ? `${content.substring(0, 47)}...` : content,
          details: content,
          content: content,
          submittedBy: currentOb.name,
          authorDepartment: currentOb.department,
          mediaType,
          mediaUrl: mediaUrl || null,
          mediaPublicId: mediaPublicId || "",
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.proposal) {
          const newPost: FeedPostItem = {
            id: result.proposal.id,
            authorName: currentOb.name,
            authorDepartment: currentOb.department,
            timestamp: result.proposal.submittedDate,
            content,
            mediaType,
            mediaUrl,
            mediaPublicId,
            status: "Pending Approval",
            likesCount: 0,
            dislikesCount: 0,
          };
          setFeedPosts((prev) => [newPost, ...prev]);
          console.log(`✅ [MONGODB] Feed Post submitted for approval: ${result.proposal.id}`);
        }
      } else {
        console.error("❌ Failed to submit feed post proposal to MongoDB");
      }
    } catch (err) {
      console.error("❌ Feed Post submission network error:", err);
    }
  };

  const toggleFeedVote = async (postId: string, vote: "like" | "dislike") => {
    const post = feedPosts.find((p) => p.id === postId);
    if (!post) return;

    const currentVote = post.userVote;

    // Optimistic UI update
    setFeedPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;

        let newLikes = p.likesCount;
        let newDislikes = p.dislikesCount;
        let newVote: "like" | "dislike" | null = vote;

        if (currentVote === vote) {
          newVote = null;
          if (vote === "like") newLikes = Math.max(0, newLikes - 1);
          if (vote === "dislike") newDislikes = Math.max(0, newDislikes - 1);
        } else {
          if (currentVote === "like") newLikes = Math.max(0, newLikes - 1);
          if (currentVote === "dislike") newDislikes = Math.max(0, newDislikes - 1);

          if (vote === "like") newLikes += 1;
          if (vote === "dislike") newDislikes += 1;
        }

        return {
          ...p,
          likesCount: newLikes,
          dislikesCount: newDislikes,
          userVote: newVote,
        };
      })
    );

    // Persist vote to MongoDB
    try {
      await fetch("/api/admin/proposals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: postId,
          action: "vote",
          vote,
          currentVote: currentVote || null,
        }),
      });
    } catch (err) {
      console.error("Failed to persist feed vote to MongoDB:", err);
    }
  };

  // Submit a revision for an already-approved activity
  const submitRevision = async (
    parentId: string,
    changes: Record<string, any>,
    revisionComment?: string
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/admin/proposals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: parentId,
          action: "revise",
          changes,
          revisionComment: revisionComment || "",
        }),
      });

      if (res.ok) {
        const result = await res.json();
        console.log(`✅ [MONGODB] Revision #${result.revisionNumber} created for ${parentId}`);
        // Refresh proposals from MongoDB to get the latest state
        await fetchProposalsData();
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("❌ Failed to create revision:", errData.message);
        alert(errData.message || "Failed to submit revision for re-approval.");
        return false;
      }
    } catch (err) {
      console.error("❌ Revision submission network error:", err);
      alert("Network error. Failed to submit revision.");
      return false;
    }
  };

  // Extend or adjust deadline for an approved activity without requiring Admin re-approval
  const extendDeadline = async (
    activityId: string,
    endAt: string | Date,
    startAt?: string | Date
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/office-bearer/activities/timeline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId,
          endAt: typeof endAt === "string" ? endAt : endAt.toISOString(),
          startAt: startAt ? (typeof startAt === "string" ? startAt : startAt.toISOString()) : undefined,
        }),
      });

      if (res.ok) {
        console.log(`✅ [MONGODB] Deadline updated for activity: ${activityId}`);
        await fetchProposalsData();
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("❌ Failed to update deadline:", errData.message);
        alert(errData.message || "Failed to update activity deadline.");
        return false;
      }
    } catch (err) {
      console.error("❌ Deadline update network error:", err);
      alert("Network error while updating deadline.");
      return false;
    }
  };

  const refreshProposals = fetchProposalsData;

  const publishedFeedPosts = feedPosts.filter((p) => p.status === "Approved");

  return (
    <OBAuthContext.Provider
      value={{
        isAuthenticated,
        isHydrated,
        currentOb,
        loginOb,
        logoutOb,
        switchObPersona,
        hasResponsibility,
        submissions,
        submitQuizProposal,
        feedPosts,
        submitFeedPost,
        toggleFeedVote,
        publishedFeedPosts,
        submitRevision,
        extendDeadline,
        refreshProposals,
      }}
    >
      {children}
    </OBAuthContext.Provider>
  );
};

export const useOBAuth = () => {
  const context = useContext(OBAuthContext);
  if (!context) {
    throw new Error("useOBAuth must be used within an OBAuthProvider");
  }
  return context;
};
