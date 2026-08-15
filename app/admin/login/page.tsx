import { LoginLayout } from "@/components/auth/LoginLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administrator Login — Microsoft Campus Club",
  description: "Administrative login portal for the Microsoft Campus Club platform.",
};

export default function AdminLoginPage() {
  return (
    <LoginLayout role="admin">
      <LoginForm
        role="admin"
        eyebrow="MCC ADMINISTRATION"
        title="Administrator Login"
        description="Sign in to access the MCC administration platform."
      />
    </LoginLayout>
  );
}
