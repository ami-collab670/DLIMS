import { staffPath } from "@/lib/staff";
import { Link } from "react-router-dom";
import { FlaskConical } from "lucide-react";

export function LabTechDashboardQuickLinks() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Quick links</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to={staffPath("prep")}
          className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
        >
          <div className="flex items-center gap-2 text-sm font-medium group-hover:text-primary">
            <FlaskConical className="size-4 shrink-0" aria-hidden />
            Open preparation bench
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Start or complete preparation on your assigned queue.
          </p>
        </Link>
      </div>
    </section>
  );
}
