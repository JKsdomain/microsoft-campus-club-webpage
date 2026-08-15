"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  showText?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  showText = false,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0078D4] ${
        theme === "dark"
          ? "bg-[#0D1B2A] border-white/15 text-[#CBD5E1] hover:text-white hover:border-white/30"
          : "bg-white border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 shadow-sm"
      } ${className}`}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          {showText && <span>Light</span>}
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-[#0078D4]" />
          {showText && <span>Dark</span>}
        </>
      )}
    </button>
  );
};
