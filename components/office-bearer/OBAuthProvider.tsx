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
  submitQuizProposal: (submission: Omit<QuizSubmission, "id" | "submittedBy" | "submittedDate" | "status">) => void;

  feedPosts: FeedPostItem[];
  submitFeedPost: (content: string, mediaType?: "none" | "image" | "video", mediaUrl?: string) => void;
  toggleFeedVote: (postId: string, vote: "like" | "dislike") => void;
  publishedFeedPosts: FeedPostItem[];
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

  useEffect(() => {
    const savedAuth = localStorage.getItem("mcc_ob_authenticated");
    const hasCookie = typeof document !== "undefined" && document.cookie.includes("mcc_ob_session");
    if (savedAuth === "true" || hasCookie) {
      setIsAuthenticated(true);
      const savedEmail = localStorage.getItem("mcc_ob_email") || "";
      const savedName = localStorage.getItem("mcc_ob_name") || "Office Bearer";
      const savedDept = localStorage.getItem("mcc_ob_dept") || "Computer Science";
      const savedResp = (localStorage.getItem("mcc_ob_resp") || "Unassigned") as OBProfile["assignedResponsibility"];
      setCurrentOb({
        id: "ob-session",
        name: savedName,
        email: savedEmail,
        department: savedDept,
        assignedResponsibility: savedResp,
      });
    } else {
      setIsAuthenticated(false);
      setCurrentOb(EMPTY_OB);
    }
    setIsHydrated(true);
  }, []);

  const loginOb = (email: string, obData?: Partial<OBProfile>) => {
    setIsAuthenticated(true);
    localStorage.setItem("mcc_ob_authenticated", "true");
    localStorage.setItem("mcc_ob_email", email);

    const newOb: OBProfile = {
      id: obData?.id || "ob-" + Date.now(),
      name: obData?.name || email.split("@")[0],
      email: email,
      department: obData?.department || "Computer Science",
      assignedResponsibility: obData?.assignedResponsibility || "Unassigned",
    };
    setCurrentOb(newOb);
    localStorage.setItem("mcc_ob_name", newOb.name);
    localStorage.setItem("mcc_ob_dept", newOb.department);
    localStorage.setItem("mcc_ob_resp", newOb.assignedResponsibility);
    if (typeof document !== "undefined") {
      document.cookie = `mcc_ob_session=${encodeURIComponent(email)}; path=/; max-age=86400; SameSite=Lax`;
    }
  };

  const logoutOb = () => {
    setIsAuthenticated(false);
    setCurrentOb(EMPTY_OB);
    localStorage.removeItem("mcc_ob_authenticated");
    localStorage.removeItem("mcc_ob_email");
    localStorage.removeItem("mcc_ob_name");
    localStorage.removeItem("mcc_ob_dept");
    localStorage.removeItem("mcc_ob_resp");
    if (typeof document !== "undefined") {
      document.cookie = "mcc_ob_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  };

  const switchObPersona = (obId: string) => {
    const match = PRESET_OBS.find((ob) => ob.id === obId);
    if (match) {
      setCurrentOb(match);
      localStorage.setItem("mcc_ob_email", match.email);
    }
  };

  const hasResponsibility = (
    activityName: "Placement Questions" | "General Quiz" | "Technical Games" | "Feed Community"
  ): boolean => {
    // STRICT RULE: EXACTLY ONE RESPONSIBILITY
    return currentOb.assignedResponsibility === activityName;
  };

  const submitQuizProposal = (
    data: Omit<QuizSubmission, "id" | "submittedBy" | "submittedDate" | "status">
  ) => {
    const newSub: QuizSubmission = {
      ...data,
      id: `sub-${Date.now()}`,
      submittedBy: currentOb.name,
      submittedDate: new Date().toISOString().replace("T", " ").substring(0, 16),
      status: "Pending Approval",
    };
    setSubmissions((prev) => [newSub, ...prev]);
  };

  const submitFeedPost = (
    content: string,
    mediaType: "none" | "image" | "video" = "none",
    mediaUrl?: string
  ) => {
    const newPost: FeedPostItem = {
      id: `feed-${Date.now()}`,
      authorName: currentOb.name,
      authorDepartment: currentOb.department,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      content,
      mediaType,
      mediaUrl,
      status: "Pending Approval",
      likesCount: 0,
      dislikesCount: 0,
    };
    setFeedPosts((prev) => [newPost, ...prev]);
  };

  const toggleFeedVote = (postId: string, vote: "like" | "dislike") => {
    setFeedPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;

        const currentVote = post.userVote;
        let newLikes = post.likesCount;
        let newDislikes = post.dislikesCount;
        let newVote: "like" | "dislike" | null = vote;

        if (currentVote === vote) {
          // Toggle off existing vote
          newVote = null;
          if (vote === "like") newLikes = Math.max(0, newLikes - 1);
          if (vote === "dislike") newDislikes = Math.max(0, newDislikes - 1);
        } else {
          // Change vote or set new vote
          if (currentVote === "like") newLikes = Math.max(0, newLikes - 1);
          if (currentVote === "dislike") newDislikes = Math.max(0, newDislikes - 1);

          if (vote === "like") newLikes += 1;
          if (vote === "dislike") newDislikes += 1;
        }

        return {
          ...post,
          likesCount: newLikes,
          dislikesCount: newDislikes,
          userVote: newVote,
        };
      })
    );
  };

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
