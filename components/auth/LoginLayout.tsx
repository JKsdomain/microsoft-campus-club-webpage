import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginImagePanel } from "./LoginImagePanel";

interface LoginLayoutProps {
  role: "admin" | "office-bearer";
  children: React.ReactNode;
}

export const LoginLayout: React.FC<LoginLayoutProps> = ({
  role,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#07111F] text-[#F8FAFC] flex flex-col justify-between relative selection:bg-[#0078D4]/30 selection:text-white">
      {/* Top Subtle Header Bar */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 sm:p-6 flex items-center justify-between pointer-events-none">
        <Link
          href="/"
          className="pointer-events-auto inline-flex items-center space-x-2 text-xs font-medium text-[#94A3B8] hover:text-white bg-[#0D1B2A]/80 border border-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Landing</span>
        </Link>
      </header>

      {/* Main 2-Panel Grid (Desktop 50/50, Mobile Stacked) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        {/* Left Image Panel (45%-50% on desktop) */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col">
          <LoginImagePanel role={role} />
        </div>

        {/* Right Form Panel (50%-55% on desktop) */}
        <div className="lg:col-span-7 xl:col-span-7 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-[#0D1B2A]/50">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
};
