<<<<<<< HEAD
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { fetchJobOrders } from "@/features/jobs/api";
import { JOB_STATUS_LABEL } from "@/lib/job-order-labels";

=======
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
import { ClientGettingStartedCard } from "./client-getting-started-card";
import { ClientWelcomeHeader } from "./client-welcome-header";

export default function ClientDashboardHome() {
<<<<<<< HEAD
  const { data: jobs, isLoading } = useQuery({
    queryKey: ["client-dashboard-jobs"],
    queryFn: () => fetchJobOrders({ page: 1, is_cancelled: false }),
    staleTime: 30_000,
  });

  const activeCount = jobs?.count ?? 0;
  const recent = jobs?.results.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <ClientWelcomeHeader />

      <section className="rounded-xl border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-semibold">Your requests</h2>
        {isLoading ? (
          <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeCount === 0
                ? "No active job orders yet."
                : `${activeCount} active job order${activeCount === 1 ? "" : "s"}.`}
            </p>
            {recent.length > 0 ? (
              <ul className="mt-3 divide-y rounded-lg border text-sm">
                {recent.map((j) => (
                  <li
                    key={j.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
                  >
                    <span className="font-mono text-xs">{j.id.slice(0, 8)}…</span>
                    <span className="text-muted-foreground">
                      {JOB_STATUS_LABEL[j.current_status]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {j.sample_count} sample(s)
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to="/client/requests">View all requests</Link>
            </Button>
          </>
        )}
      </section>

=======
  return (
    <div className="space-y-6">
      <ClientWelcomeHeader />
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
      <ClientGettingStartedCard />
    </div>
  );
}
