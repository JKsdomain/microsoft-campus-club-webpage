import React from "react";
import Link from "next/link";
import { Container } from "../ui/Container";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#07111F] border-t border-white/10 pt-16 pb-12 text-[#CBD5E1]">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          
          {/* Brand Column (5 cols) */}
          <div className="md:col-span-6 lg:col-span-5 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <img
                src="/images/mcc-logo.jpeg"
                alt="MCC — Microsoft Campus Club"
                className="h-9 w-auto object-contain rounded-lg"
              />
              <div className="flex flex-col">
                <span className="font-bold text-lg text-[#F8FAFC]">MCC</span>
                <span className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">
                  Microsoft Campus Club
                </span>
              </div>
            </Link>

            <p className="text-sm text-[#CBD5E1] leading-relaxed max-w-sm">
              The official centralized digital platform for the Microsoft Campus Club community. Uniting students, technical initiatives, activities, and resources.
            </p>
          </div>

          {/* Navigation Column (4 cols) */}
          <div className="md:col-span-3 lg:col-span-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F8FAFC]">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-[#CBD5E1]">
              <li>
                <Link href="/" className="hover:text-[#0078D4] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/students-corner" className="hover:text-[#0078D4] transition-colors">
                  Students Corner
                </Link>
              </li>
              <li>
                <Link href="/announcements" className="hover:text-[#0078D4] transition-colors">
                  Announcements
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Column (3 cols) */}
          <div className="md:col-span-3 lg:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F8FAFC]">
              Role Portals
            </h4>
            <ul className="space-y-2 text-sm text-[#CBD5E1]">
              <li>
                <Link href="/office-bearer/login" className="hover:text-[#22D3EE] transition-colors">
                  Office Bearer Login
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-purple-400 transition-colors">
                  Admin Login
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#94A3B8] gap-4">
          <p>© {new Date().getFullYear()} Microsoft Campus Club. All rights reserved.</p>
          <p className="font-mono">MCC Digital Platform — Authentication Gateway</p>
        </div>
      </Container>
    </footer>
  );
};
