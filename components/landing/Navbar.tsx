"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShieldCheck, UserCheck } from "lucide-react";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { ThemeToggle } from "../ui/ThemeToggle";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Students Corner", href: "/students-corner" },
  { label: "Technical Games", href: "/students-corner?tab=technical-games" },
  { label: "Announcements", href: "/announcements" },
];

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 border-b ${
        scrolled
          ? "bg-[#07111F]/90 backdrop-blur-md border-white/10 shadow-lg shadow-black/20 py-3.5"
          : "bg-[#07111F]/70 backdrop-blur-sm border-white/5 py-4"
      }`}
    >
      <Container>
        <div className="flex items-center justify-between h-[52px]">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0078D4] rounded-md"
          >
            <img
              src="/images/mcc-logo.jpeg"
              alt="MCC — Microsoft Campus Club"
              className="h-9 sm:h-10 w-auto object-contain rounded-lg"
            />
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg tracking-tight text-[#F8FAFC] leading-none group-hover:text-white">
                MCC
              </span>
              <span className="text-[10px] font-medium text-[#94A3B8] tracking-wider uppercase leading-tight mt-0.5">
                Microsoft Campus Club
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "text-[#0078D4] bg-white/[0.06]"
                      : "text-[#CBD5E1] hover:text-[#F8FAFC] hover:bg-white/[0.04]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Role Authentication Entry Points & Theme Toggle */}
          <div className="hidden lg:flex items-center space-x-2.5">
            <ThemeToggle showText />
            <Button
              href="/office-bearer/login"
              variant="ob-login"
              size="sm"
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
            >
              OB Login
            </Button>
            <Button
              href="/admin/login"
              variant="admin-login"
              size="sm"
              leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
            >
              Admin Login
            </Button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="lg:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#CBD5E1] hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0078D4]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-6 pt-2 border-t border-white/10 space-y-4 animate-fade-in">
            <div className="flex flex-col space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`px-4 py-2.5 text-base font-medium rounded-lg transition-colors ${
                      isActive
                        ? "text-[#0078D4] bg-[#0D1B2A]"
                        : "text-[#CBD5E1] hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col space-y-2.5">
              <div className="flex items-center justify-between px-1 py-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Theme
                </span>
                <ThemeToggle showText />
              </div>
              <Button
                href="/office-bearer/login"
                variant="ob-login"
                size="md"
                className="w-full justify-start"
                leftIcon={<UserCheck className="w-4 h-4" />}
              >
                OB Login
              </Button>
              <Button
                href="/admin/login"
                variant="admin-login"
                size="md"
                className="w-full justify-start"
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              >
                Admin Login
              </Button>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
};
