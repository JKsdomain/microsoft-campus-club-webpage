import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { Activity } from "lucide-react";

export default function ActivitiesPage() {
  return (
    <ModulePlaceholder
      moduleName="Activities Module"
      moduleCode="MODULE 04"
      description="Interactive hub for student coding challenges, peer-to-peer project showcases, bootcamps, and technical skill tracks."
      icon={<Activity className="w-7 h-7 text-[#0078D4]" />}
    />
  );
}
