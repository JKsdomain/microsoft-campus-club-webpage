import React from "react";
import { Compass, Target } from "lucide-react";
import { Container } from "../ui/Container";

export const MissionVision: React.FC = () => {
  return (
    <section className="py-20 bg-[#07111F] border-t border-white/10 relative overflow-hidden text-[#F8FAFC]">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0078D4]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <Container>
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0078D4]/10 border border-[#0078D4]/20 text-[#0078D4]">
            <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em]">
              OUR PURPOSE
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F8FAFC]">
            Mission &amp; Vision
          </h2>

          <p className="text-base sm:text-lg text-[#CBD5E1] leading-relaxed">
            At MCC, curiosity becomes capability through collaboration, practical challenges, and a community built to help students grow.
          </p>
        </div>

        {/* Vision & Mission 2-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          
          {/* VISION CARD */}
          <div className="group relative rounded-2xl bg-[#0D1B2A]/80 border border-white/15 p-8 sm:p-10 shadow-xl transition-all duration-300 hover:border-[#0078D4]/50 hover:shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header Icon & Tag */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-[0.2em] font-semibold text-[#0078D4]">
                  VISION
                </span>
                <div className="p-2.5 rounded-xl bg-[#0078D4]/10 border border-[#0078D4]/20 text-[#0078D4] group-hover:scale-110 transition-transform">
                  <Compass className="w-6 h-6" />
                </div>
              </div>

              {/* Primary Vision Statement */}
              <h3 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] leading-tight tracking-tight">
                &ldquo;Turning curious students into confident tech innovators.&rdquo;
              </h3>

              {/* Supporting Text */}
              <p className="text-sm text-[#CBD5E1] leading-relaxed">
                We encourage students to explore technology with curiosity, build confidence through experience, and transform ideas into meaningful solutions.
              </p>
            </div>

            {/* Bottom Accent Bar */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-[#94A3B8] font-mono">
              <span>EXPLORE &bull; BUILD &bull; INNOVATE</span>
              <span className="w-2 h-2 rounded-full bg-[#0078D4] animate-pulse" />
            </div>
          </div>

          {/* MISSION CARD */}
          <div className="group relative rounded-2xl bg-[#0D1B2A]/80 border border-white/15 p-8 sm:p-10 shadow-xl transition-all duration-300 hover:border-cyan-500/50 hover:shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header Icon & Tag */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-[0.2em] font-semibold text-cyan-400">
                  MISSION
                </span>
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6" />
                </div>
              </div>

              {/* Primary Mission Statement */}
              <h3 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] leading-tight tracking-tight">
                &ldquo;Growing skills through collaboration and practical challenges.&rdquo;
              </h3>

              {/* Supporting Text */}
              <p className="text-sm text-[#CBD5E1] leading-relaxed">
                We create opportunities for students to learn together, apply their skills through hands-on challenges, and grow through meaningful participation.
              </p>
            </div>

            {/* Bottom Accent Bar */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-[#94A3B8] font-mono">
              <span>COLLABORATE &bull; CHALLENGE &bull; GROW</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
};
