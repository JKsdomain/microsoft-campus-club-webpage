import { ModulePlaceholder } from "@/components/ui/ModulePlaceholder";
import { Users } from "lucide-react";

export default function MembersPage() {
  return (
    <ModulePlaceholder
      moduleName="Member Directory"
      moduleCode="MODULE 07"
      description="The official campus network directory connecting student members, project leads, technical mentors, and office bearer leads."
      icon={<Users className="w-7 h-7 text-[#22D3EE]" />}
    />
  );
}
