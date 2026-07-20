import { NavLink, Outlet } from "react-router-dom";

import { cn } from "@/lib/utils";

import { StaffRoleBanner } from "@/pages/staff/lims-extensions/staff-role-banner";

const TABS = [
  { to: "/staff/qc", label: "Review desk", end: true },
  { to: "/staff/qc/history", label: "Decision history", end: false },
  { to: "/staff/qc/rejected", label: "Rejected", end: false },
] as const;

export default function StaffQcLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">QC review</h2>
        <p className="text-sm text-muted-foreground">
          Approve or reject submitted analysis results in your department. Client identity is
          hidden; workflow advances when results pass QC.
        </p>
      </div>

      <StaffRoleBanner />

      <nav className="flex flex-wrap gap-2 border-b border-border pb-2">
        {TABS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
