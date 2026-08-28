import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Microsoft Campus Club (MCC) — Centralized Campus Technology Platform",
  description:
    "The official digital platform for the Microsoft Campus Club community. Connect, Collaborate, and Build with student technology initiatives, events, activities, and resources.",
  keywords: [
    "Microsoft Campus Club",
    "MCC",
    "Campus Technology Platform",
    "Student Developers",
    "Events",
    "Clubs",
    "Resources",
  ],
  authors: [{ name: "Microsoft Campus Club" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark scroll-smooth`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  document.documentElement.classList.remove('light');
                  document.documentElement.classList.add('dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#07111F] text-[#F8FAFC] font-sans antialiased selection:bg-[#0078D4]/30 selection:text-white flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
