import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { Calendar } from "lucide-react";

export default function EventsPage() {
  return (
    <ModulePlaceholder
      moduleName="Events Module"
      moduleCode="MODULE 02"
      description="The central system for discovering, scheduling, registering, and managing Microsoft Campus Club workshops, hackathons, and tech talks."
      icon={<Calendar className="w-7 h-7 text-[#0078D4]" />}
    />
  );
}
