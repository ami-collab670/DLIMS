import { useQueries } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { fetchJobOrders } from "@/features/jobs/api";
import { fetchSamples } from "@/features/laboratory/staff-api";
import { canIntakeSamples, canManageJobsAndSamples } from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";

import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";

const SAMPLE_QUEUE = [
  { status: "submitted", label: "Submitted" },
  { status: "received", label: "Received" },
  { status: "in_prep", label: "In preparation" },
  { status: "in_analysis", label: "In analysis" },
  { status: "qc", label: "Quality control" },
] as const;

const JOB_ACTIVE = [
  { status: "pending_finance", label: "Pending finance" },
  { status: "received", label: "Received" },
  { status: "in_prep", label: "In prep" },
  { status: "in_analysis", label: "In analysis" },
  { status: "qc", label: "QC" },
] as const;

/**
 * Backend: workload inferred from job and sample status counts (same filters as dashboard).
 */
export default function StaffSchedulingPage() {
  const user = useAuthStore((s) => s.user);
  const intake = canIntakeSamples(user);
  const manage = canManageJobsAndSamples(user);

  const jobQueries = useQueries({
    queries: JOB_ACTIVE.map(({ status }) => ({
      queryKey: ["lims-schedule-jobs", status],
      queryFn: () =>
        fetchJobOrders({
          page: 1,
          current_status: status,
          is_cancelled: false,
        }),
      staleTime: 60_000,
    })),
  });

  const sampleQueries = useQueries({
    queries: SAMPLE_QUEUE.map(({ status }) => ({
      queryKey: ["lims-schedule-samples", status],
      queryFn: () => fetchSamples({ page: 1, sample_status: status }),
      staleTime: 60_000,
    })),
  });

  return (
    <div className="space-y-8">
      <LimsPageIntro title="Scheduling &amp; workload">
        <p>
          There is no dedicated bench calendar API. Queues below aggregate{" "}
          <code className="rounded bg-muted px-1">count</code> from paginated job and sample
          listings — scoped automatically to your role (e.g. analysts only see assigned samples).
        </p>
      </LimsPageIntro>

      <StaffRoleBanner />

      <div className="rounded-lg border border-dashed bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
        {intake
          ? "As intake staff, monitor submitted jobs on the main dashboard and advance client requests."
          : null}
        {manage && !intake
<<<<<<< HEAD
          ? "You can move jobs and samples through workflow statuses from Laboratory and Analyst."
=======
          ? "You can move jobs and samples through workflow statuses from Laboratory and Samples."
>>>>>>> ab11eb2ffff845da9c0abb09db22510c1fe75fa9
          : null}
        {!manage && user?.user_type === "internal"
          ? "Use this snapshot to see pipeline depth; detailed actions follow your role permissions."
          : null}
        {!user ? null : (
          <>
            {" "}
            <Link to="/staff/laboratory" className="text-primary underline-offset-4 hover:underline">
              Open laboratory
            </Link>
            .
          </>
        )}
      </div>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-medium">Active jobs by stage</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {JOB_ACTIVE.map(({ label }, i) => (
            <li
              key={label}
              className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-center"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-semibold tabular-nums">
                {jobQueries[i].data?.count ?? "—"}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-medium">Samples in laboratory queue</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {SAMPLE_QUEUE.map(({ label }, i) => (
            <li
              key={label}
              className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-center"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-semibold tabular-nums">
                {sampleQueries[i].data?.count ?? "—"}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
