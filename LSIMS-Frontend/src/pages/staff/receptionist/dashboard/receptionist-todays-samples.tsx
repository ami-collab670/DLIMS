import { staffPath } from "@/lib/staff";
import { useQuery } from "@tanstack/react-query";
import { Loader2, TestTube } from "lucide-react";
import { Link } from "react-router-dom";

import { fetchSamples } from "@/features/laboratory/api";
import { isToday } from "@/lib/formatting";
import { shortJobId } from "@/lib/laboratory";

import { dashboardKeys } from "@/lib/staff/dashboard/query-keys";

export function ReceptionistTodaysSamples() {
  const { data, isLoading, isError } = useQuery({
    queryKey: dashboardKeys.receptionistTodaysSamples,
    queryFn: () => fetchSamples({ page: 1, page_size: 50 }),
    staleTime: 60_000,
  });

  const todaySamples = (data?.results ?? []).filter((s) => isToday(s.created_at));
  const preview = todaySamples.slice(0, 5);

  if (isLoading) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (isError) return null;

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
      aria-labelledby="receptionist-samples-heading"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <TestTube className="size-4 text-primary" aria-hidden />
        <h3 id="receptionist-samples-heading" className="text-sm font-medium">
          Today&apos;s samples
        </h3>
        <span className="text-xs text-muted-foreground">
          {todaySamples.length} registered today
        </span>
        <Link
          to={staffPath("laboratory")}
          className="ml-auto text-xs font-medium text-primary hover:underline"
        >
          Register sample →
        </Link>
      </div>

      {!todaySamples.length ? (
        <p className="text-sm text-muted-foreground">
          No samples registered today yet.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {preview.map((sample) => (
            <li key={sample.id} className="flex flex-wrap gap-x-3 px-3 py-2 text-sm">
              <span className="font-medium">{sample.sample_name ?? "Sample"}</span>
              {sample.job ? (
                <span className="font-mono text-xs text-muted-foreground">
                  {shortJobId(sample.job)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
