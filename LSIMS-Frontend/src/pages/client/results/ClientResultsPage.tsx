import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { fetchSamples } from "@/features/laboratory/staff-api";
import { shortJobId } from "@/lib/job-order-labels";

const PAGE_SIZE = 20;

/**
 * Backend: external users see only their samples (`job__client` filter in SampleViewSet).
 * Response includes assigned tests; no numeric results field yet.
 */
export default function ClientResultsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["client-my-samples", page],
    queryFn: () => fetchSamples({ page }),
    staleTime: 45_000,
  });

  const totalPages = data
    ? Math.max(1, Math.ceil(data.count / PAGE_SIZE))
    : 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">My samples &amp; tests</h2>
        <p className="text-sm text-muted-foreground">
          Samples linked to your job orders. Assigned catalog tests show what the laboratory
          plans to run; analytical values are not returned by the API in this version.
        </p>
      </div>

      <div className="rounded-lg border border-dashed bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
        Data source:{" "}
        <code className="rounded bg-muted px-1">GET /api/laboratory/samples/</code> scoped to
        your account. Track job intake under{" "}
        <Link to="/client/requests" className="text-primary underline-offset-4 hover:underline">
          My requests
        </Link>
        .
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="p-4 text-destructive">Could not load your samples.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 font-medium">Sample</th>
                  <th className="px-4 py-3 font-medium">Job</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Tests</th>
                </tr>
              </thead>
              <tbody>
                {data?.results.map((s) => (
                  <tr key={s.id} className="border-b border-border">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">{s.sample_code ?? "—"}</span>
                      {s.sample_name ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {s.sample_name}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {s.job ? shortJobId(s.job) : "—"}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {s.sample_status.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {s.sample_tests.length
                        ? s.sample_tests.map((t) => t.test_code).join(", ")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.count > 0 ? (
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <span>
              Page {page} of {totalPages} ({data.count} samples)
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : !isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">
            No samples are registered for your jobs yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
