import React from "react";
import { Container } from "../ui/Container";
import { SectionHeading } from "../ui/SectionHeading";
import { Code2, Users, Cpu, GraduationCap } from "lucide-react";

export const AboutMCC: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 bg-[#0D1B2A]/40 border-y border-white/5 relative">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Text Content */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <SectionHeading
              eyebrow="ABOUT MCC"
              title="Technology. Community. Opportunity."
              description="The Microsoft Campus Club is an institutional student technology community dedicated to fostering continuous learning, interdisciplinary collaboration, and technological empowerment."
            />

            <div className="space-y-6 -mt-6">
              <p className="text-base text-[#CBD5E1] leading-relaxed">
                Our platform provides student developers, designers, and innovators with direct access to technical resources, collaborative workshops, skill-building events, and community-driven initiatives.
              </p>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#122438]/80 border border-white/5 flex items-start space-x-3.5">
                  <div className="p-2 rounded-lg bg-[#0078D4]/10 text-[#0078D4] shrink-0 mt-0.5">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#F8FAFC]">Learning</h4>
                    <p className="text-xs text-[#94A3B8] mt-1 leading-normal">
                      Hands-on workshops, technical sessions & certifications.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#122438]/80 border border-white/5 flex items-start space-x-3.5">
                  <div className="p-2 rounded-lg bg-[#22D3EE]/10 text-[#22D3EE] shrink-0 mt-0.5">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#F8FAFC]">Collaboration</h4>
                    <p className="text-xs text-[#94A3B8] mt-1 leading-normal">
                      Peer-to-peer mentorship & cross-domain project teams.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#122438]/80 border border-white/5 flex items-start space-x-3.5">
                  <div className="p-2 rounded-lg bg-[#0078D4]/10 text-[#0078D4] shrink-0 mt-0.5">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#F8FAFC]">Innovation</h4>
                    <p className="text-xs text-[#94A3B8] mt-1 leading-normal">
                      Building real-world software and technological solutions.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#122438]/80 border border-white/5 flex items-start space-x-3.5">
                  <div className="p-2 rounded-lg bg-[#22D3EE]/10 text-[#22D3EE] shrink-0 mt-0.5">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#F8FAFC]">Participation</h4>
                    <p className="text-xs text-[#94A3B8] mt-1 leading-normal">
                      Active club events, hackathons, and community leadership.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Abstract Community Graphic Visual */}
          <div className="lg:col-span-6 w-full">
            <div className="relative rounded-2xl border border-white/10 bg-[#07111F] p-8 overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#0078D4]/10 blur-3xl rounded-full pointer-events-none" />

              {/* Graphic Layering */}
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-[#0078D4]" />
                    <span className="text-xs font-mono text-[#CBD5E1] tracking-wider uppercase">
                      MCC ECOSYSTEM ARCHITECTURE
                    </span>
                  </div>
                  <span className="text-xs text-[#94A3B8] font-mono">v1.0</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0D1B2A] p-5 rounded-xl border border-white/5">
                    <span className="text-[11px] font-mono text-[#0078D4] uppercase block mb-1">
                      01 // STUDENTS
                    </span>
                    <h5 className="text-sm font-semibold text-[#F8FAFC]">Campus Community</h5>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      Learners, builders, and future technology leaders.
                    </p>
                  </div>

                  <div className="bg-[#0D1B2A] p-5 rounded-xl border border-white/5">
                    <span className="text-[11px] font-mono text-[#22D3EE] uppercase block mb-1">
                      02 // CLUBS
                    </span>
                    <h5 className="text-sm font-semibold text-[#F8FAFC]">Domain Specializations</h5>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      AI, Web, Cloud, Mobile, Security, and Design wings.
                    </p>
                  </div>

                  <div className="bg-[#0D1B2A] p-5 rounded-xl border border-white/5">
                    <span className="text-[11px] font-mono text-[#22D3EE] uppercase block mb-1">
                      03 // ACTIVITIES
                    </span>
                    <h5 className="text-sm font-semibold text-[#F8FAFC]">Hands-on Execution</h5>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      Bootcamps, code jams, and tech showcase sessions.
                    </p>
                  </div>

                  <div className="bg-[#0D1B2A] p-5 rounded-xl border border-white/5">
                    <span className="text-[11px] font-mono text-[#0078D4] uppercase block mb-1">
                      04 // RESOURCES
                    </span>
                    <h5 className="text-sm font-semibold text-[#F8FAFC]">Centralized Knowledge</h5>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      Curated study materials, dev kits, and repositories.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#122438]/90 border border-[#0078D4]/20 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-[#0078D4] animate-ping" />
                    <span className="text-xs text-[#CBD5E1] font-medium">
                      Seamlessly integrated under one digital platform.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};
