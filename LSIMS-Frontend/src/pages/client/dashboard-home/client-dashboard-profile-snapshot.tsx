import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { fetchProfile } from "@/features/auth/api";
import { useAuthStore } from "@/stores/auth-store";

import { clientDashboardKeys } from "./client-dashboard-api-keys";

function profileCompleteness(profile: {
  phone?: string;
  organization_name?: string;
  organization_type?: string;
}): { complete: number; total: number; missing: string[] } {
  const fields: { key: keyof typeof profile; label: string }[] = [
    { key: "phone", label: "Phone" },
    { key: "organization_name", label: "Organization" },
    { key: "organization_type", label: "Organization type" },
  ];
  const missing = fields
    .filter(({ key }) => !profile[key]?.trim())
    .map(({ label }) => label);
  return {
    complete: fields.length - missing.length,
    total: fields.length,
    missing,
  };
}

export function ClientDashboardProfileSnapshot() {
  const authUser = useAuthStore((s) => s.user);
  const { data: profile, isLoading } = useQuery({
    queryKey: clientDashboardKeys.profile,
    queryFn: fetchProfile,
    staleTime: 120_000,
  });

  const user = profile ?? authUser;

  if (isLoading && !user) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (!user) return null;

  const { complete, total, missing } = profileCompleteness(user);
  const pct = Math.round((complete / total) * 100);
  const joined = user.date_joined
    ? new Date(user.date_joined).toLocaleDateString(undefined, { dateStyle: "medium" })
    : "—";

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-labelledby="profile-snapshot-heading"
    >
      <h3 id="profile-snapshot-heading" className="text-sm font-medium">
        Your account
      </h3>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Organization</dt>
          <dd className="mt-0.5 font-medium">
            {user.organization_name?.trim() || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Member since</dt>
          <dd className="mt-0.5">{joined}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Profile completeness</dt>
          <dd className="mt-0.5">
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
            </div>
            {missing.length > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Missing: {missing.join(", ")}.{" "}
                <Link to="/client/profile" className="text-primary hover:underline">
                  Complete profile
                </Link>
              </p>
            ) : (
              <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                Profile complete
              </p>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
