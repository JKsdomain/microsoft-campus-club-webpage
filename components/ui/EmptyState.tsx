import React from "react";
import { FolderOpen } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No data available",
  description = "Check back soon for new MCC updates and activities.",
  icon,
  action,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 rounded-xl border border-white/10 bg-[#0D1B2A]/40 max-w-lg mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#122438] flex items-center justify-center text-[#94A3B8] mb-4 border border-white/5">
        {icon || <FolderOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">{title}</h3>
      <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
