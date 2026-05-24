import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Link2,
  TestTube,
} from "lucide-react";
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
        active={tab === "analyst"}
        onClick={() => onTabChange("analyst")}
        icon={TestTube}
        label="Analyst"
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
