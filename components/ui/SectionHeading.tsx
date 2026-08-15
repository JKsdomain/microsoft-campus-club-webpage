import React from "react";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  align = "left",
  className = "",
}) => {
  const alignClasses =
    align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`max-w-3xl mb-12 sm:mb-16 ${alignClasses} ${className}`}>
      {eyebrow && (
        <span className="inline-block text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] text-[#0078D4] mb-3">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#F8FAFC] tracking-tight leading-[1.15]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base sm:text-lg text-[#CBD5E1] leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};
