"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/components/admin/AdminAuthProvider";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAdminAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // Auth Guard: If not on login page and not authenticated, redirect to /admin/login
    if (!isLoginPage && !isAuthenticated) {
      router.push("/admin/login");
    }
  }, [isAuthenticated, isLoginPage, router]);

  // If on login page, render children directly (no sidebar/header)
  if (isLoginPage) {
    return <>{children}</>;
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
