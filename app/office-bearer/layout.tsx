"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { OBAuthProvider, useOBAuth } from "@/components/office-bearer/OBAuthProvider";
import { OBSidebar } from "@/components/office-bearer/OBSidebar";
import { OBHeader } from "@/components/office-bearer/OBHeader";

function OBLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useOBAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/office-bearer/login";

  useEffect(() => {
    // Auth Guard: If not on login page and not authenticated after hydration, redirect to /office-bearer/login
    if (isHydrated && !isLoginPage && !isAuthenticated) {
      router.push("/office-bearer/login");
    }
  }, [isAuthenticated, isHydrated, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#07111F] text-[#F8FAFC] flex items-center justify-center p-4">
        <div className="flex items-center space-x-3 text-sm text-[#94A3B8]">
          <span className="w-5 h-5 border-2 border-[#0078D4] border-t-transparent rounded-full animate-spin" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    switch (pathname) {
      case "/office-bearer/dashboard":
        return "Dashboard";
      case "/office-bearer/submissions":
        return "My Submissions";
      case "/office-bearer/responsibilities":
        return "My Responsibilities";
      case "/office-bearer/general-quiz":
        return "General Quiz";
      case "/office-bearer/placement-questions":
        return "Placement Questions";
      case "/office-bearer/technical-games":
        return "Technical Games";
      case "/office-bearer/feed-community":
        return "Feed Community";
      case "/office-bearer/feed":
        return "Common Feed";
      default:
        return "Office Bearer Portal";
    }
  };

  return (
    <div className="min-h-screen bg-[#07111F] text-[#F8FAFC] flex flex-col lg:flex-row">
      <OBSidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <OBHeader
          title={getPageTitle()}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function OBLayout({ children }: { children: React.ReactNode }) {
  return (
    <OBAuthProvider>
      <OBLayoutInner>{children}</OBLayoutInner>
    </OBAuthProvider>
  );
}
