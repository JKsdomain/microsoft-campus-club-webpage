import { Navbar } from "@/components/landing/Navbar";
import { AnnouncementBar } from "@/components/landing/AnnouncementBar";
import { Hero } from "@/components/landing/Hero";
import { AboutMCC } from "@/components/landing/AboutMCC";
import { StorySections } from "@/components/landing/StorySections";
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

        {/* 3. About MCC */}
        <AboutMCC />

        {/* 4, 5, 6, 7. Story Sections (IGNITE, INNOVATE, IMPACT, CONNECT) */}
        <StorySections />

        {/* 8. Explore MCC Platform */}
        <PlatformSection />
      </main>

      {/* 9. Footer */}
      <Footer />
    </div>
  );
}
