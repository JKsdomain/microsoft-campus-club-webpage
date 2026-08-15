import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { Boxes } from "lucide-react";

export default function ClubsPage() {
  return (
    <ModulePlaceholder
      moduleName="Clubs Ecosystem"
      moduleCode="MODULE 03"
      description="The official gateway for exploring MCC domain specializations including AI & ML, Web Technologies, Cloud Systems, Cybersecurity, and Design."
      icon={<Boxes className="w-7 h-7 text-[#22D3EE]" />}
    />
  );
}
