import React from "react";
import { OBSubmissions } from "@/components/office-bearer/OBSubmissions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Submissions — Office Bearer Portal",
  description: "View submission history and approval status for Office Bearer proposals.",
};

export default function OBSubmissionsPage() {
  return <OBSubmissions />;
}
