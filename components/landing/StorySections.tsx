import React from "react";
import { Container } from "../ui/Container";
import { Sparkles, Lightbulb, Target, Network } from "lucide-react";

export const StorySections: React.FC = () => {
  return (
    <div className="space-y-0">
      {/* 1. IGNITE */}
      <section className="py-24 sm:py-32 bg-gradient-to-b from-[#07111F] via-[#0D1B2A]/60 to-[#07111F] border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#0078D4]/10 blur-[120px] rounded-full pointer-events-none" />
        <Container>
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#122438] border border-white/10 text-xs font-mono uppercase tracking-[0.2em] text-[#0078D4] mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>STORY // 01</span>
            </div>

            <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-[#F8FAFC] leading-none mb-3">
              IGNITE
            </h2>
            <span className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-[0.25em] text-[#0078D4] uppercase mb-8">
              YOUR PASSION
            </span>

            <p className="text-base sm:text-lg text-[#CBD5E1] max-w-2xl leading-relaxed font-normal">
              Sparking curiosity and empowering student energy. We turn initial interest into technical capability through hands-on discovery and accessible learning paths.
            </p>
          </div>
        </Container>
      </section>

      {/* 2. INNOVATE */}
      <section className="py-24 sm:py-32 bg-[#0D1B2A]/80 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-[#22D3EE]/10 blur-[120px] rounded-full pointer-events-none" />
        <Container>
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#122438] border border-white/10 text-xs font-mono uppercase tracking-[0.2em] text-[#22D3EE] mb-6">
              <Lightbulb className="w-3.5 h-3.5 text-[#0078D4]" />
              <span>STORY // 02</span>
            </div>

            <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-[#F8FAFC] leading-none mb-3">
              INNOVATE
            </h2>
            <span className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-[0.25em] text-[#22D3EE] uppercase mb-8">
              WITHOUT LIMITS
            </span>

            <p className="text-base sm:text-lg text-[#CBD5E1] max-w-2xl leading-relaxed font-normal">
              Pushing technological boundaries with real projects, hackathons, and experimental software development. Where student ideas transform into practical systems.
            </p>
          </div>
        </Container>
      </section>

      {/* 3. IMPACT */}
      <section className="py-24 sm:py-32 bg-[#07111F] border-t border-white/5 relative overflow-hidden">
        <Container>
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#122438] border border-white/10 text-xs font-mono uppercase tracking-[0.2em] text-[#CBD5E1] mb-6">
              <Target className="w-3.5 h-3.5 text-[#0078D4]" />
              <span>STORY // 03</span>
            </div>

            <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-[#F8FAFC] leading-none mb-3">
              IMPACT
            </h2>
            <span className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-[0.25em] text-[#CBD5E1] uppercase mb-8">
              WHAT MATTERS
            </span>

            <p className="text-base sm:text-lg text-[#CBD5E1] max-w-2xl leading-relaxed font-normal">
              Creating meaningful contributions for the campus community. Building software and leading initiatives that foster long-term growth and technical excellence.
            </p>
          </div>
        </Container>
      </section>

      {/* 4. CONNECT */}
      <section className="py-24 sm:py-32 bg-gradient-to-b from-[#07111F] via-[#0D1B2A] to-[#07111F] border-t border-b border-white/5 relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-48 bg-[#0078D4]/10 blur-3xl pointer-events-none" />
        <Container>
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#122438] border border-white/10 text-xs font-mono uppercase tracking-[0.2em] text-[#0078D4] mb-6">
              <Network className="w-3.5 h-3.5 text-[#22D3EE]" />
              <span>STORY // 04</span>
            </div>

            <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-[#F8FAFC] leading-none mb-3">
              CONNECT
            </h2>
            <span className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-[0.25em] text-[#0078D4] uppercase mb-8">
              BEYOND BOUNDARIES
            </span>

            <p className="text-base sm:text-lg text-[#CBD5E1] max-w-2xl leading-relaxed font-normal mb-10">
              Uniting students across disciplines into one cohesive ecosystem. Expanding networks, sharing insights, and preparing together for the future of technology.
            </p>

            <div className="w-16 h-0.5 bg-[#0078D4]/50 rounded-full" />
          </div>
        </Container>
      </section>
    </div>
  );
};
