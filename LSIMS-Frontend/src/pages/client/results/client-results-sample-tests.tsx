import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { fetchSampleTests } from "@/features/laboratory/staff-api";

import {
  ClientProgressBadge,
  formatClientDateTime,
} from "./client-results-progress";

export function ClientResultsSampleTests({
  sampleId,
  sampleStatus,
}: {
  sampleId: string;
  sampleStatus: string;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["client-results-sample-tests", sampleId],
    queryFn: () => fetchSampleTests({ sample: sampleId, page: 1 }),
    enabled: Boolean(sampleId),
    staleTime: 45_000,
  });

  return (
    <div className="mt-4 border-t border-border/60 pt-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Test progress
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Progress reflects the sample workflow stage — analytical values are not shown here.
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading tests…
        </div>
      ) : isError ? (
        <p className="py-3 text-sm text-destructive">Could not load assigned tests.</p>
      ) : !data?.results.length ? (
        <p className="py-3 text-sm text-muted-foreground">
          No tests assigned yet for this sample.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-border/60 rounded-md border border-border/60">
          {data.results.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{row.test_name}</p>
                <p className="text-xs text-muted-foreground">
                  {row.test_code} · Assigned {formatClientDateTime(row.created_at)}
                </p>
              </div>
              <ClientProgressBadge status={sampleStatus} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
