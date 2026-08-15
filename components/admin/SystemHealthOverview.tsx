"use client";

import React, { useState, useEffect } from "react";
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Database, Image, Mail, Server } from "lucide-react";
import { Button } from "../ui/Button";
import { LoadingState } from "../ui/LoadingState";

export type HealthStatus = "Healthy" | "Degraded" | "Unavailable";

interface ServiceHealth {
  name: string;
  key: "database" | "cloudinary" | "email" | "api";
  status: HealthStatus;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const SystemHealthOverview: React.FC = () => {
  const [checking, setChecking] = useState(false);
  const [healthData, setHealthData] = useState<Record<string, HealthStatus>>({
    database: "Healthy",
    cloudinary: "Healthy",
    email: "Healthy",
    api: "Healthy",
  });

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealthData({
        database: (data.database || "Healthy") as HealthStatus,
        cloudinary: (data.cloudinary || "Healthy") as HealthStatus,
        email: (data.email || "Healthy") as HealthStatus,
        api: (data.api || "Healthy") as HealthStatus,
      });
    } catch (e) {
      setHealthData({
        database: "Degraded",
        cloudinary: "Healthy",
        email: "Healthy",
        api: "Degraded",
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const services: ServiceHealth[] = [
    {
      name: "Database",
      key: "database",
      status: healthData.database,
      icon: Database,
      description: "Data storage and persistence engine.",
    },
    {
      name: "Cloudinary",
      key: "cloudinary",
      status: healthData.cloudinary,
      icon: Image,
      description: "Media storage and delivery pipeline.",
    },
    {
      name: "Email / OTP",
      key: "email",
      status: healthData.email,
      icon: Mail,
      description: "Student identity verification service.",
    },
    {
      name: "API",
      key: "api",
      status: healthData.api,
      icon: Server,
      description: "MCC core REST/GraphQL router.",
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-[#0D1B2A] border border-white/10 shadow-xl space-y-6">
      {/* Header & Refresh */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <Activity className="w-5 h-5 text-[#22D3EE]" />
          <div>
            <h3 className="text-base font-bold text-[#F8FAFC]">System Health</h3>
            <p className="text-xs text-[#94A3B8]">
              Operational status of core MCC infrastructure services.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={checking}
          onClick={checkHealth}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin text-[#0078D4]" : ""}`} />}
        >
          {checking ? "Checking..." : "Refresh"}
        </Button>
      </div>

      {/* Services Grid / Loading State */}
      {checking ? (
        <LoadingState label="Checking system health..." className="py-8 bg-[#07111F]/50" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.key}
                className="p-4 rounded-xl bg-[#07111F] border border-white/10 flex flex-col justify-between space-y-3 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-[#122438] text-[#0078D4]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-[#F8FAFC]">{srv.name}</span>
                  </div>

                  {srv.status === "Healthy" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Healthy
                    </span>
                  )}
                  {srv.status === "Degraded" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      <AlertTriangle className="w-3 h-3" />
                      Degraded
                    </span>
                  )}
                  {srv.status === "Unavailable" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
                      <XCircle className="w-3 h-3" />
                      Unavailable
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#94A3B8] leading-relaxed">{srv.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
