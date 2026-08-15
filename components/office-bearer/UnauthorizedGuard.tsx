"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "../ui/Button";

interface UnauthorizedGuardProps {
  activityName: string;
}

export const UnauthorizedGuard: React.FC<UnauthorizedGuardProps> = ({
  activityName,
}) => {
  return (
    <div className="py-16 px-4 text-center max-w-lg mx-auto space-y-6 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-[#F8FAFC]">
          Access Restricted
        </h3>
        <p className="text-sm text-[#CBD5E1] leading-relaxed">
          You are not assigned to the <span className="font-semibold text-white">&quot;{activityName}&quot;</span> responsibility.
        </p>
        <p className="text-xs text-[#94A3B8]">
          Only Office Bearers explicitly assigned to this activity by an Administrator can access this management module.
        </p>
      </div>

      <div className="pt-2">
        <Link href="/office-bearer/dashboard">
          <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
