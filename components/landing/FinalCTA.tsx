"use client";

import React from "react";
import { ArrowRight, UserCheck, ShieldCheck } from "lucide-react";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";

export const FinalCTA: React.FC = () => {
  const scrollToExplore = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.preventDefault();
    const element = document.getElementById("explore-platform");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-20 sm:py-28 bg-[#0D1B2A]/60 border-t border-white/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-radial from-[#0078D4]/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      <Container>
        <div className="max-w-4xl mx-auto rounded-3xl bg-[#0D1B2A] border border-white/15 p-8 sm:p-12 lg:p-16 text-center relative z-10 shadow-2xl shadow-black/40">
          
          {/* Eyebrow */}
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-[#0078D4] mb-3">
            JOIN THE COMMUNITY
          </span>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F8FAFC] tracking-tight mb-4">
            Be Part of MCC
          </h2>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg text-[#CBD5E1] max-w-xl mx-auto leading-relaxed mb-8">
            Access learning resources, connect with student developers, participate in technical workshops, and collaborate on real-world projects.
          </p>

          {/* Hierarchy Row: Primary Explore CTA + Operational Role Portals */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              href="#explore-platform"
              onClick={scrollToExplore}
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Explore MCC
            </Button>

            <Button
              href="/office-bearer/login"
              variant="ob-login"
              size="lg"
              leftIcon={<UserCheck className="w-4 h-4" />}
            >
              Office Bearer Login
            </Button>

            <Button
              href="/admin/login"
              variant="admin-login"
              size="lg"
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Admin Login
            </Button>
          </div>

        </div>
      </Container>
    </section>
  );
};
