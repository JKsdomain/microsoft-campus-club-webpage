import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { BookOpen } from "lucide-react";

export default function ResourcesPage() {
  return (
    <ModulePlaceholder
      moduleName="Resource Hub"
      moduleCode="MODULE 06"
      description="Centralized repository of study guides, developer documentation, Azure learning paths, project templates, and session recordings."
      icon={<BookOpen className="w-7 h-7 text-[#0078D4]" />}
    />
  );
}
