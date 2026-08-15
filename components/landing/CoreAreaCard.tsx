import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export interface CoreAreaItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  tag?: string;
}

interface CoreAreaCardProps {
  item: CoreAreaItem;
}

export const CoreAreaCard: React.FC<CoreAreaCardProps> = ({ item }) => {
  return (
    <Link
      href={item.href}
      className="group relative h-full flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-[#0D1B2A] border border-white/10 hover:border-[#0078D4]/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#0078D4]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0078D4]"
    >
      <div>
        {/* Card Header: Icon & Top Arrow */}
        <div className="flex items-center justify-between mb-6">
          <div className="p-3 rounded-xl bg-[#122438] text-[#0078D4] border border-white/5 group-hover:bg-[#0078D4] group-hover:text-white transition-colors duration-300">
            {item.icon}
          </div>
          <div className="p-2 rounded-lg text-[#94A3B8] group-hover:text-[#22D3EE] group-hover:bg-white/5 transition-colors">
            <ArrowUpRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>

        {/* Card Heading */}
        <h3 className="text-xl font-semibold text-[#F8FAFC] group-hover:text-[#22D3EE] transition-colors mb-2.5">
          {item.title}
        </h3>

        {/* Card Short Description */}
        <p className="text-sm text-[#CBD5E1] leading-relaxed">
          {item.description}
        </p>
      </div>

      {/* Bottom Subtle Indicator */}
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-medium text-[#94A3B8] group-hover:text-[#F8FAFC] transition-colors">
        <span>Explore Module</span>
        <span className="text-[#0078D4] group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </Link>
  );
};
