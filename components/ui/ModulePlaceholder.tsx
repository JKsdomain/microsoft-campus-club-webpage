import React from "react";
import { ArrowLeft, Clock } from "lucide-react";
import { Container } from "./Container";
import { Button } from "./Button";
import { Navbar } from "../landing/Navbar";
import { Footer } from "../landing/Footer";

interface ModulePlaceholderProps {
  moduleName: string;
  moduleCode: string;
  description: string;
  icon?: React.ReactNode;
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  moduleName,
  moduleCode,
  description,
  icon,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#07111F] text-[#F8FAFC]">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-20">
        <Container>
          <div className="max-w-2xl mx-auto p-8 sm:p-12 rounded-2xl bg-[#0D1B2A] border border-white/10 text-center shadow-2xl shadow-black/40">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#122438] text-[#0078D4] border border-white/10 mb-6 mx-auto">
              {icon || <Clock className="w-7 h-7" />}
            </div>

            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0078D4] block mb-2">
              MCC PLATFORM // {moduleCode}
            </span>

            <h1 className="text-3xl sm:text-4xl font-bold text-[#F8FAFC] mb-4">
              {moduleName}
            </h1>

            <p className="text-base text-[#CBD5E1] leading-relaxed mb-8">
              {description}
            </p>

            <div className="p-4 rounded-xl bg-[#122438]/80 border border-white/5 flex items-center justify-center space-x-3 mb-8">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22D3EE] animate-pulse" />
              <span className="text-xs text-[#CBD5E1] font-medium">
                Route entry point established. Full UI and functionality will be integrated in future modules.
              </span>
            </div>

            <Button
              href="/"
              variant="secondary"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Return to Landing Page
            </Button>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
};
