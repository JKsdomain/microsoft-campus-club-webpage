import { LoginLayout } from "@/components/auth/LoginLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Office Bearer Login — Microsoft Campus Club",
  description: "Official Office Bearer login portal for the Microsoft Campus Club platform.",
};

export default function OfficeBearerLoginPage() {
  return (
    <LoginLayout role="office-bearer">
      <LoginForm
        role="office-bearer"
        eyebrow="MICROSOFT CAMPUS CLUB"
        title="Office Bearer Login"
        description="Sign in to access the MCC Office Bearer platform."
      />
    </LoginLayout>
  );
}
