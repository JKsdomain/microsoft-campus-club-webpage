import { Navbar } from "@/components/landing/Navbar";
import { AnnouncementBar } from "@/components/landing/AnnouncementBar";
import { Hero } from "@/components/landing/Hero";
import { MissionVision } from "@/components/landing/MissionVision";
import { StorySections } from "@/components/landing/StorySections";
import { NoticeBoardSection } from "@/components/landing/NoticeBoardSection";
import { PlatformSection } from "@/components/landing/PlatformSection";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#07111F] text-[#F8FAFC]">
      {/* 1. Header / Navigation */}
      <Navbar />

      {/* Published Landing Page Announcement Bar */}
      <AnnouncementBar />

      {/* Main Content Sections */}
      <main className="flex-grow">
        {/* 2. Hero Section */}
        <Hero />

        {/* 3. Official MCC Notice Board (5 Dynamic Tabs) */}
        <NoticeBoardSection />

        {/* 4. Mission & Vision Section */}
        <MissionVision />

        {/* 5, 6, 7, 8. Story Sections (IGNITE, INNOVATE, IMPACT, CONNECT) */}
        <StorySections />

        {/* 9. Explore MCC Platform */}
        <PlatformSection />
      </main>

      {/* 10. Footer */}
      <Footer />
    </div>
  );
}
