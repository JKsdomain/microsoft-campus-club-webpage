"use client";

import React from "react";
import { ArrowRight, UserCheck, ShieldCheck } from "lucide-react";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { HeroVisual } from "./HeroVisual";

export const Hero: React.FC = () => {
  const scrollToExplore = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.preventDefault();
    const element = document.getElementById("explore-platform");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-24 lg:pb-32 overflow-hidden mcc-glow-hero">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column - Content (55%) */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 sm:space-y-8">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#122438] border border-white/10 text-xs font-semibold uppercase tracking-[0.15em] text-[#0078D4]">
              <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" />
              MICROSOFT CAMPUS CLUB
            </div>

            {/* Dominant Hero Heading */}
            <h1 className="text-[38px] sm:text-5xl lg:text-[64px] font-bold text-[#F8FAFC] tracking-tight leading-[1.05]">
              Connect. <br />
              Collaborate. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0078D4] via-[#0284C7] to-[#0891B2] dark:from-[#F8FAFC] dark:via-[#CBD5E1] dark:to-[#0078D4]">
                Build.
              </span>
            </h1>

            {/* Concise Supporting Description */}
            <p className="text-base sm:text-lg lg:text-xl text-[#CBD5E1] leading-relaxed max-w-2xl font-normal">
              A centralized digital platform bringing together students, technical initiatives,
              activities, and resources across the Microsoft Campus Club community.
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2 w-full sm:w-auto">
              <Button
                href="#explore-platform"
                onClick={scrollToExplore}
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Explore MCC
              </Button>
              <Button
                href="/office-bearer/login"
                variant="ob-login"
                size="lg"
                leftIcon={<UserCheck className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                OB Login
              </Button>
              <Button
                href="/admin/login"
                variant="admin-login"
                size="lg"
                leftIcon={<ShieldCheck className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Admin Login
              </Button>
            </div>
          </div>

          {/* Right Column - Visual (45%) */}
          <div className="lg:col-span-5 w-full">
            <HeroVisual />
          </div>
        </div>
      </Container>
    </section>
  );
};
