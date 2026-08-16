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
              department: userObj.department || "Computer Science",
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
  }, []);

  const loginOb = (email: string, obData?: Partial<OBProfile>) => {
    setIsAuthenticated(true);
    const newOb: OBProfile = {
      id: obData?.id || "ob-" + Date.now(),
      name: obData?.name || email.split("@")[0],
      email: email,
      department: obData?.department || "Computer Science",
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
