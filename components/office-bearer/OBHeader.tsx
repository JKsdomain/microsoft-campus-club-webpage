"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Award } from "lucide-react";
import { useOBAuth } from "./OBAuthProvider";

interface OBHeaderProps {
  title: string;
  onOpenMobileSidebar: () => void;
}

export const OBHeader: React.FC<OBHeaderProps> = ({
  title,
  onOpenMobileSidebar,
}) => {
  const router = useRouter();
  const { currentOb, logoutOb } = useOBAuth();

  const handleLogout = async () => {
    await logoutOb();
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-20 bg-[#07111F]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between">
      {/* Left: Mobile Drawer & Title */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-[#CBD5E1] hover:text-white hover:bg-white/10 focus:outline-none"
          aria-label="Open Navigation Drawer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F8FAFC] tracking-tight leading-none">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Authenticated OB Info & Logout */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="hidden sm:flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-[#0D1B2A] border border-white/10">
          <div className="w-8 h-8 rounded-lg bg-[#0078D4]/20 border border-[#0078D4]/30 flex items-center justify-center">
            <Award className="w-4 h-4 text-[#22D3EE]" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-[#F8FAFC]">
              {currentOb.name}
            </span>
            <span className="text-[11px] text-[#94A3B8] font-mono">
              Office Bearer • {currentOb.department}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center space-x-2 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-2 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
