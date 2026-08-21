import React from "react";
import Link from "next/link";
import { Container } from "../ui/Container";
import { SectionHeading } from "../ui/SectionHeading";
import {
  Calendar,
  Boxes,
  Activity,
  Megaphone,
  Users,
  ArrowRight,
} from "lucide-react";

interface PlatformModule {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const PLATFORM_MODULES: PlatformModule[] = [
  {
    title: "Events",
    description: "Access upcoming hackathons, tech talks, workshops, and campus meetups.",
    href: "https://microsoft-campus-club-webpage.vercel.app/students-corner",
    icon: <Calendar className="w-5 h-5 text-[#0078D4]" />,
  },
  {
    title: "Clubs Ecosystem",
    description: "Explore technical wings including AI, Web Dev, Cloud Architecture, and Security.",
    href: "https://mcc-about-us-page.vercel.app/",
    icon: <Boxes className="w-5 h-5 text-[#22D3EE]" />,
  },
  {
    title: "Student Activities",
    description: "Participate in coding challenges, project showcases, and team initiatives.",
    href: "https://microsoft-campus-club-webpage.vercel.app/students-corner",
    icon: <Activity className="w-5 h-5 text-[#0078D4]" />,
  },
  {
    title: "Announcements",
    description: "Official notifications, club guidelines, updates, and schedule releases.",
    href: "/announcements",
    icon: <Megaphone className="w-5 h-5 text-[#22D3EE]" />,
  },
  {
    title: "Member Directory",
    description: "Connect with fellow club members, leads, mentors, and office bearers.",
    href: "https://mcc-about-us-page.vercel.app/",
    icon: <Users className="w-5 h-5 text-[#22D3EE]" />,
  },
];

export const PlatformSection: React.FC = () => {
  return (
    <section id="explore-platform" className="py-20 sm:py-28 bg-[#07111F] relative">
      <Container>
        <SectionHeading
          eyebrow="MCC DIGITAL PLATFORM"
          title="Explore the MCC Platform"
          description="The central digital gateway uniting all Microsoft Campus Club operations, activities, and community resources into one integrated platform."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLATFORM_MODULES.map((mod) => (
            <Link
              key={mod.title}
              href={mod.href}
              className="group p-6 rounded-xl bg-[#0D1B2A] border border-white/10 hover:border-[#0078D4]/40 transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center mb-4">
                  <div className="p-2.5 rounded-lg bg-[#122438] border border-white/5">
                    {mod.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-[#F8FAFC] group-hover:text-[#0078D4] transition-colors mb-2">
                  {mod.title}
                </h3>
                <p className="text-sm text-[#CBD5E1] leading-relaxed">
                  {mod.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-medium text-[#0078D4] group-hover:text-[#22D3EE] transition-colors">
                <span>View Gateway</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
};
