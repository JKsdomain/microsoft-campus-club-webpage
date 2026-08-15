"use client";

import React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ob-login"
  | "admin-login"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  href?: string;
  className?: string;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      href,
      className = "",
      disabled,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    // Size styles
    const sizeClasses = {
      sm: "h-9 px-3.5 text-xs tracking-wide",
      md: "h-11 px-5 text-sm font-medium",
      lg: "h-12 px-6 text-base font-semibold",
    };

    // Variant styles
    const variantClasses = {
      primary:
        "bg-[#0078D4] text-[#F8FAFC] hover:bg-[#0063B1] active:bg-[#004E8C] shadow-md shadow-[#0078D4]/15 border border-[#0078D4]/50",
      secondary:
        "bg-[#122438] text-[#CBD5E1] hover:bg-[#1E3A5F] hover:text-[#F8FAFC] border border-white/10 active:bg-[#0D1B2A]",
      outline:
        "bg-transparent text-[#CBD5E1] hover:bg-white/[0.04] hover:text-[#F8FAFC] border border-white/15 active:bg-white/[0.08]",
      "ob-login":
        "bg-[#0D1B2A] text-[#22D3EE] hover:bg-[#122438] hover:text-white border border-[#22D3EE]/30 active:bg-[#122438]",
      "admin-login":
        "bg-[#0D1B2A] text-purple-300 hover:bg-[#122438] hover:text-purple-200 border border-purple-500/30 active:bg-[#122438]",
      ghost:
        "bg-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.04]",
    };

    const baseClasses =
      "inline-flex items-center justify-center font-sans rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0078D4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none";

    const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

    const content = (
      <>
        {isLoading && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />
        )}
        {!isLoading && leftIcon && <span className="mr-2 inline-flex">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="ml-2 inline-flex">{rightIcon}</span>}
      </>
    );

    if (href && !disabled && !isLoading) {
      return (
        <Link href={href} className={combinedClasses}>
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        onClick={onClick}
        className={combinedClasses}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = "Button";
