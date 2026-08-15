"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import { LoginModal, ModalType } from "./LoginModal";

interface LoginFormProps {
  role: "admin" | "office-bearer";
  eyebrow: string;
  title: string;
  description: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  role,
  eyebrow,
  title,
  description,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim(), role }),
      });

      if (response.ok) {
        if (role === "admin") {
          localStorage.setItem("mcc_admin_authenticated", "true");
          localStorage.setItem("mcc_admin_email", email.trim());
          document.cookie = `mcc_admin_session=${encodeURIComponent(email.trim())}; path=/; max-age=86400; SameSite=Lax`;
        } else {
          localStorage.setItem("mcc_ob_authenticated", "true");
          localStorage.setItem("mcc_ob_email", email.trim());
          document.cookie = `mcc_ob_session=${encodeURIComponent(email.trim())}; path=/; max-age=86400; SameSite=Lax`;
        }
        setModalType("success");
      } else {
        setModalType("invalid");
      }
    } catch {
      setModalType("invalid");
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalConfirm = () => {
    const currentModal = modalType;
    setModalType(null);

    // Navigate cleanly after authenticated session is established
    if (currentModal === "success") {
      if (role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/office-bearer/dashboard");
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col justify-center py-6">
      {/* Brand Header & Title */}
      <div className="mb-8">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#0078D4] block mb-2 font-semibold">
          {eyebrow}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight mb-2">
          {title}
        </h1>
        <p className="text-sm text-[#CBD5E1] leading-relaxed">
          {description}
        </p>
      </div>

      {/* Form Element */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-[#CBD5E1]"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full h-12 px-4 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 transition-all duration-200"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-[#CBD5E1]"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full h-12 px-4 rounded-xl bg-[#07111F] border border-white/15 text-[#F8FAFC] placeholder-[#94A3B8] text-sm focus:outline-none focus:border-[#0078D4] focus:ring-2 focus:ring-[#0078D4]/20 transition-all duration-200"
          />
        </div>

        {/* Full-width Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          disabled={isLoading || !email || !password}
          className="w-full h-12 font-semibold text-base mt-2"
        >
          {isLoading ? "Signing in..." : "Login"}
        </Button>
      </form>

      {/* Modal Popup */}
      <LoginModal
        type={modalType}
        role={role}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
};
