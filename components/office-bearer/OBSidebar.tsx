"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CircleHelp,
  BriefcaseBusiness,
  Gamepad2,
  Users,
  Rss,
  LogOut,
  X,
  UserCheck,
  ShieldAlert,
  History,
} from "lucide-react";
import { useOBAuth } from "./OBAuthProvider";
import { PRESET_OBS } from "@/lib/obState";

interface OBSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const OBSidebar: React.FC<OBSidebarProps> = ({
  mobileOpen,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentOb, logoutOb, switchObPersona } = useOBAuth();

  const handleLogout = () => {
    logoutOb();
    router.push("/office-bearer/login");
  };

  // Map of activity names to route metadata
  const ACTIVITY_ROUTES: Record<
    string,
    { label: string; href: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    "General Quiz": {
      label: "General Quiz",
      href: "/office-bearer/general-quiz",
      icon: CircleHelp,
    },
    "Placement Questions": {
      label: "Placement Questions",
      href: "/office-bearer/placement-questions",
      icon: BriefcaseBusiness,
    },
    "Technical Games": {
      label: "Technical Games",
      href: "/office-bearer/technical-games",
      icon: Gamepad2,
    },
    "Feed Community": {
      label: "Feed Community",
      href: "/office-bearer/feed-community",
      icon: Users,
    },
  };

  // STRICT RULE: Exactly ONE assigned responsibility
  const assignedName = currentOb.assignedResponsibility;
  const singleRouteMeta = assignedName !== "Unassigned" ? ACTIVITY_ROUTES[assignedName] : null;

  const navContent = (
    <div className="flex flex-col h-full bg-[#0D1B2A] border-r border-white/10 w-64 p-5 text-[#CBD5E1]">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 mb-4 border-b border-white/10">
        <Link href="/office-bearer/dashboard" className="flex items-center gap-3 group">
          <div className="grid grid-cols-2 gap-0.5 w-6 h-6 p-0.5 rounded bg-white/5 border border-white/10 group-hover:border-[#0078D4]/50 transition-colors">
            <span className="bg-[#00A4EF] rounded-[1px]" />
            <span className="bg-[#7FBA00] rounded-[1px]" />
            <span className="bg-[#F25022] rounded-[1px]" />
            <span className="bg-[#FFB900] rounded-[1px]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-[#F8FAFC]">
              MCC OFFICE BEARER
            </span>
            <span className="text-[10px] font-mono text-[#22D3EE] uppercase tracking-wider">
              Leadership Portal
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

      {/* Main Navigation */}
      <div className="flex-1 space-y-5 overflow-y-auto">
        {/* Dashboard & Submissions Links */}
        <div className="space-y-1">
          <Link
            href="/office-bearer/dashboard"
            onClick={onCloseMobile}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              pathname === "/office-bearer/dashboard"
                ? "bg-[#0078D4] text-white shadow-md shadow-[#0078D4]/20"
                : "text-[#CBD5E1] hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <LayoutDashboard
              className={`w-4 h-4 ${
                pathname === "/office-bearer/dashboard" ? "text-white" : "text-[#94A3B8]"
              }`}
            />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/office-bearer/submissions"
            onClick={onCloseMobile}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              pathname === "/office-bearer/submissions"
                ? "bg-[#0078D4] text-white shadow-md shadow-[#0078D4]/20"
                : "text-[#CBD5E1] hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <History
              className={`w-4 h-4 ${
                pathname === "/office-bearer/submissions" ? "text-white" : "text-[#22D3EE]"
              }`}
            />
            <span>My Submissions</span>
          </Link>
        </div>

        {/* STRICT RULE: MY RESPONSIBILITY (Singular - EXACTLY ONE) */}
        <div className="space-y-1.5">
          <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-[#94A3B8] font-semibold block">
            MY RESPONSIBILITY
          </span>

          {!singleRouteMeta ? (
            <div className="px-3 py-2 text-xs text-[#94A3B8] italic flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Unassigned</span>
            </div>
          ) : (
            (() => {
              const isActive = pathname === singleRouteMeta.href;
              const Icon = singleRouteMeta.icon;

              return (
                <Link
                  href={singleRouteMeta.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[#0078D4] text-white shadow-md shadow-[#0078D4]/20"
                      : "text-[#CBD5E1] hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${isActive ? "text-white" : "text-[#22D3EE]"}`}
                  />
                  <span className="truncate">{singleRouteMeta.label}</span>
                </Link>
              );
            })()
          )}
        </div>

        {/* Common Platform Feed Link */}
        <div className="space-y-1 pt-2 border-t border-white/10">
          <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-[#94A3B8] font-semibold block mb-1.5">
            COMMUNITY
          </span>
          <Link
            href="/office-bearer/feed"
            onClick={onCloseMobile}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              pathname === "/office-bearer/feed"
                ? "bg-[#0078D4] text-white shadow-md shadow-[#0078D4]/20"
                : "text-[#CBD5E1] hover:text-white hover:bg-white/[0.06]"
            }`}
          >
            <Rss
              className={`w-4 h-4 ${
                pathname === "/office-bearer/feed" ? "text-white" : "text-[#94A3B8]"
              }`}
            />
            <span>Feed</span>
          </Link>
        </div>
      </div>

      {/* Demo Switcher & Logout */}
      <div className="pt-4 border-t border-white/10 mt-auto space-y-3">
        {/* Switch Persona for testing single responsibility assigned to different OBs */}
        <div className="p-2.5 rounded-xl bg-[#07111F] border border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-[#22D3EE]" /> Active OB Persona
            </span>
          </div>
          <select
            value={currentOb.id}
            onChange={(e) => switchObPersona(e.target.value)}
            className="w-full text-xs bg-[#0D1B2A] border border-white/15 text-[#F8FAFC] rounded-lg p-1.5 focus:outline-none"
          >
            {PRESET_OBS.map((ob) => (
              <option key={ob.id} value={ob.id}>
                {ob.name} ({ob.assignedResponsibility})
              </option>
            ))}
          </select>
        </div>

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
      <aside className="hidden lg:block fixed top-0 left-0 bottom-0 z-30">
        {navContent}
      </aside>

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
