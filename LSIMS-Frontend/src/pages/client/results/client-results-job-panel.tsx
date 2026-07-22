import { useQuery } from "@tanstack/react-query";
import { Loader2, Package, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { fetchJobOrder } from "@/features/jobs/api";
import type { JobOrder } from "@/types/laboratory";

import { ClientRequestPriorityBadge } from "../requests/client-request-badges";
import { ClientProgressStepper } from "./client-results-progress";
import { formatClientDateTime } from "@/lib/client";
import { ClientResultsSamplesList } from "./client-results-samples-list";

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

function JobDetailFields({ job }: { job: JobOrder }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      <DetailRow
        label="Progress"
        value={
          <ClientProgressStepper
            status={job.current_status}
            isCancelled={job.is_cancelled}
          />
        }
      />
      <DetailRow
        label="Priority"
        value={<ClientRequestPriorityBadge priority={job.priority} />}
      />
      <DetailRow
        label="Samples"
        value={
          <span className="inline-flex items-center gap-1">
            <Package className="size-4 opacity-70" aria-hidden />
            {job.sample_count}
          </span>
        }
      />
      <DetailRow label="Created" value={formatClientDateTime(job.created_at)} />
      <DetailRow label="Last updated" value={formatClientDateTime(job.updated_at)} />
      {job.status_reason?.trim() ? (
        <div className="sm:col-span-2">
          <DetailRow
            label="Status note"
            value={
              <span className="whitespace-pre-wrap">{job.status_reason}</span>
            }
          />
        </div>
      ) : null}
      {job.is_cancelled ? (
        <div className="sm:col-span-2">
          <DetailRow
            label="Cancellation"
            value={
              <span className="text-destructive">
                {job.cancellation_reason?.trim() || "This job was cancelled."}
              </span>
            }
          />
        </div>
      ) : null}
      <div className="sm:col-span-2">
        <DetailRow
          label="Description"
          value={
            <span className="whitespace-pre-wrap">
              {job.description?.trim() || "—"}
            </span>
          }
        />
      </div>
    </dl>
  );
}

export function ClientResultsJobDetailPanel({
  jobId,
  listJob,
  onClose,
}: {
  jobId: string;
  listJob: JobOrder;
  onClose: () => void;
}) {
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSampleId(null);
  }, [jobId]);

  const { data: detailJob, isLoading, isError } = useQuery({
    queryKey: ["client-results-job", jobId],
    queryFn: () => fetchJobOrder(jobId),
    enabled: Boolean(jobId),
    staleTime: 45_000,
  });

  const job = detailJob ?? listJob;
  const title = job.description?.trim() || "Untitled request";

  return (
    <div className="flex h-full flex-col border-l border-border bg-card shadow-xl">
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Job progress
          </p>
          <p className="line-clamp-2 text-sm font-semibold">{title}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close details"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && !detailJob ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading job details…
          </div>
        ) : isError && !detailJob ? (
          <p className="py-2 text-sm text-destructive">
            Could not load full job details. Showing summary from list.
          </p>
        ) : null}

        {!selectedSampleId ? <JobDetailFields job={job} /> : null}

        <ClientResultsSamplesList
          jobId={jobId}
          selectedSampleId={selectedSampleId}
          onSelectSample={setSelectedSampleId}
        />
      </div>
    </div>
  );
}

/** @deprecated Use ClientResultsJobDetailPanel */
export const ClientResultsJobPanel = ClientResultsJobDetailPanel;
