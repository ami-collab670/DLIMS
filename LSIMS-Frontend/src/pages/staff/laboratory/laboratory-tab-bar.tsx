import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
<<<<<<< HEAD
  Link2,
  TestTube,
} from "lucide-react";
=======
  FlaskConical,
  Link2,
  Package,
} from "lucide-react";

>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
import { cn } from "@/lib/utils";

import type { LaboratoryTabId } from "./constants";

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted/60 text-muted-foreground hover:bg-muted",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

export function LaboratoryTabBar({
  tab,
  onTabChange,
  showAssignmentsTab = true,
}: {
  tab: LaboratoryTabId;
  onTabChange: (t: LaboratoryTabId) => void;
  /** Admin/receptionist only per backend for assigning tests; others use read-only laboratory views. */
  showAssignmentsTab?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <TabButton
        active={tab === "jobs"}
        onClick={() => onTabChange("jobs")}
        icon={ClipboardList}
        label="Job orders"
      />
      <TabButton
<<<<<<< HEAD
        active={tab === "analyst"}
        onClick={() => onTabChange("analyst")}
        icon={TestTube}
        label="Analyst"
=======
        active={tab === "samples"}
        onClick={() => onTabChange("samples")}
        icon={Package}
        label="Samples"
      />
      <TabButton
        active={tab === "catalog"}
        onClick={() => onTabChange("catalog")}
        icon={FlaskConical}
        label="Test catalog"
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
      />
      {showAssignmentsTab ? (
        <TabButton
          active={tab === "assignments"}
          onClick={() => onTabChange("assignments")}
          icon={Link2}
          label="Test assignments"
        />
      ) : null}
    </div>
  );
}
