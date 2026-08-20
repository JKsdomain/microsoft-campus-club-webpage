"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CheckCircle2,
  Megaphone,
  FileClock,
  LogOut,
  X,
} from "lucide-react";
import { useAdminAuth } from "./AdminAuthProvider";

const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "User Management", href: "/admin/user-management", icon: Users },
  { label: "Responsibility Management", href: "/admin/responsibilities", icon: ClipboardList },
  { label: "Approval Workflow", href: "/admin/approvals", icon: CheckCircle2 },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { label: "Audit & Logs", href: "/admin/audit-logs", icon: FileClock },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  mobileOpen,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logoutAdmin } = useAdminAuth();

  const handleLogout = async () => {
    await logoutAdmin();
    router.replace("/");
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#0D1B2A] border-r border-white/10 w-64 p-5 text-[#CBD5E1]">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 mb-4 border-b border-white/10">
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <img
            src="/images/mcc-logo.jpeg"
            alt="MCC Logo"
            className="h-8 w-auto object-contain rounded-lg"
          />
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-[#F8FAFC]">
              MCC ADMIN
            </span>
            <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">
              Control Panel
            </span>
          </div>
        </Link>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation Section */}
      <div className="flex-1 space-y-1.5">
        <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-[#94A3B8] font-semibold block mb-2">
          Management
        </span>
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#0078D4] text-white shadow-md shadow-[#0078D4]/20"
                  : "text-[#CBD5E1] hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#94A3B8]"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer / Logout Button */}
      <div className="pt-4 border-t border-white/10 mt-auto space-y-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4 text-red-400" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 bottom-0 z-30">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 animate-fade-in">{navContent}</div>
        </div>
      )}
    </>
  );
};
