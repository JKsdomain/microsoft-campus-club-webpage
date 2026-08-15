import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  label?: string;
  className?: string;
  variant?: "spinner" | "skeleton";
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = "Loading...",
  className = "",
  variant = "spinner",
}) => {
  if (variant === "skeleton") {
    return (
      <div className={`space-y-4 w-full animate-pulse ${className}`}>
        <div className="h-6 bg-[#122438] rounded-md w-1/3"></div>
        <div className="h-4 bg-[#0D1B2A] rounded-md w-3/4"></div>
        <div className="h-4 bg-[#0D1B2A] rounded-md w-1/2"></div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 rounded-xl border border-white/10 bg-[#0D1B2A]/50 ${className}`}
    >
      <Loader2 className="w-8 h-8 text-[#0078D4] animate-spin mb-3" />
      <p className="text-sm font-medium text-[#CBD5E1] tracking-wide">{label}</p>
    </div>
  );
};
