"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAdminAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // Auth Guard: Direct authenticated users away from login page to dashboard, and unauthenticated users away from protected pages
    if (isHydrated) {
      if (!isLoginPage && !isAuthenticated) {
        router.push("/admin/login");
      } else if (isLoginPage && isAuthenticated) {
        router.push("/admin/dashboard");
      }
    }
  }, [isAuthenticated, isHydrated, isLoginPage, router]);

  // If on login page, render children directly (no sidebar/header)
  if (isLoginPage) {
    return <>{children}</>;
  }

  // If session is still hydrating on protected routes, display smooth loading state
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

  // Map route to clean header title
  const getPageTitle = () => {
    switch (pathname) {
      case "/admin/dashboard":
        return "Dashboard";
      case "/admin/user-management":
        return "User Management";
      case "/admin/responsibilities":
        return "Responsibility Management";
      case "/admin/approvals":
        return "Approval Workflow";
      case "/admin/announcements":
        return "Announcements";
      case "/admin/audit-logs":
        return "Audit & Logs";
      case "/admin/data-cleanup":
        return "Data Cleanup & System Reset";
      default:
        return "Admin Panel";
    }
  };

  return (
    <div className="min-h-screen bg-[#07111F] text-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <AdminSidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Administrative Workspace */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <AdminHeader
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminAuthProvider>
  );
}
