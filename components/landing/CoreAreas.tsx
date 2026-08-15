import React from "react";
import { Container } from "../ui/Container";
import { SectionHeading } from "../ui/SectionHeading";
import { CoreAreaCard, CoreAreaItem } from "./CoreAreaCard";
import {
  Calendar,
  Boxes,
  Activity,
  Megaphone,
  BookOpen,
  Users,
} from "lucide-react";

const CORE_AREAS_DATA: CoreAreaItem[] = [
  {
    id: "events",
    title: "Events",
    description: "Discover upcoming MCC events and activities.",
    icon: <Calendar className="w-6 h-6" />,
    href: "/events",
  },
  {
    id: "clubs",
    title: "Clubs",
    description: "Explore the MCC club ecosystem and communities.",
    icon: <Boxes className="w-6 h-6" />,
    href: "/clubs",
  },
  {
    id: "activities",
    title: "Activities",
    description: "Discover technical and community activities.",
    icon: <Activity className="w-6 h-6" />,
    href: "/activities",
  },
  {
    id: "announcements",
    title: "Announcements",
    description: "Stay informed about important MCC updates.",
    icon: <Megaphone className="w-6 h-6" />,
    href: "/announcements",
  },
  {
    id: "resources",
    title: "Resources",
    description: "Access MCC learning and community resources.",
    icon: <BookOpen className="w-6 h-6" />,
    href: "/resources",
  },
  {
    id: "members",
    title: "Members",
    description: "Explore the MCC community.",
    icon: <Users className="w-6 h-6" />,
    href: "/members",
  },
];

export const CoreAreas: React.FC = () => {
  return (
    <section className="py-20 sm:py-28 relative">
      <Container>
        <SectionHeading
          eyebrow="CORE PLATFORM AREAS"
          title="Everything MCC, Connected."
          description="Six integrated pillars structured to serve every member of the Microsoft Campus Club community."
        />

        {/* 3x2 Grid Desktop, 2x3 Tablet, 1x6 Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {CORE_AREAS_DATA.map((area) => (
            <CoreAreaCard key={area.id} item={area} />
          ))}
        </div>
      </Container>
    </section>
  );
};
