import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { fetchSamples } from "@/features/laboratory/api";
import { cn } from "@/lib/ui";
import type { SampleRecord } from "@/types/laboratory";

import { clientComplaintsUrl } from "@/lib/routing";

import { ClientProgressBadge } from "./client-results-progress";
import { formatClientDate, formatClientDateTime } from "@/lib/client";
import { ClientResultsSampleTests } from "./client-results-sample-tests";

function SampleFields({ sample }: { sample: SampleRecord }) {
  const receivedLabel =
    sample.received_by_email?.trim() ||
    (sample.received_by && sample.received_by.includes("@")
      ? sample.received_by
      : null);

  const rows: { label: string; value: string }[] = [
    {
      label: "Weight",
      value: sample.sample_weight?.trim()
        ? `${sample.sample_weight} g`
        : "—",
    },
    {
      label: "Packaging",
      value: sample.packaging_type?.trim() || "—",
    },
    {
      label: "Collection date",
      value: formatClientDate(sample.collection_date),
    },
    {
      label: "Received by",
      value: receivedLabel || "Not yet received at lab",
    },
    {
      label: "Last updated",
      value: formatClientDateTime(sample.updated_at),
    },
  ];

  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <dt className="text-xs text-muted-foreground">Status</dt>
        <dd className="mt-0.5">
          <ClientProgressBadge status={sample.sample_status} />
        </dd>
      </div>
      {rows.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-0.5 text-sm">{value}</dd>
        </div>
      ))}
      {sample.notes?.trim() ? (
        <div className="sm:col-span-2">
          <dt className="text-xs text-muted-foreground">Notes</dt>
          <dd className="mt-0.5 whitespace-pre-wrap text-sm">{sample.notes}</dd>
        </div>
      ) : null}
    </dl>
  );
}

function ClientResultsSampleDetail({
  sample,
  jobId,
  onBack,
}: {
  sample: SampleRecord;
  jobId: string;
  onBack: () => void;
}) {
  const displayName = sample.sample_name?.trim() || "Unnamed sample";

  return (
    <section className="mt-4 border-t border-border pt-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 mb-3 h-8 gap-1 px-2 text-muted-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to samples
      </Button>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-sm font-medium">{displayName}</h4>
        <Button type="button" size="sm" variant="outline" asChild>
          <Link to={clientComplaintsUrl({ job: jobId, sample: sample.id })}>
            Raise complaint
          </Link>
        </Button>
      </div>
      <SampleFields sample={sample} />
      <ClientResultsSampleTests
        sampleId={sample.id}
        sampleStatus={sample.sample_status}
      />
    </section>
  );
}

function ClientResultsSampleRow({
  sample,
  selected,
  onSelect,
}: {
  sample: SampleRecord;
  selected: boolean;
  onSelect: () => void;
}) {
  const displayName = sample.sample_name?.trim() || "Unnamed sample";

  return (
    <li>
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2.5 text-left transition-colors hover:bg-muted/30",
          selected && "border-primary/40 bg-muted/40",
        )}
        onClick={onSelect}
        aria-selected={selected}
      >
        <span className="min-w-0 truncate text-sm font-medium">{displayName}</span>
        <ClientProgressBadge status={sample.sample_status} className="shrink-0" />
      </button>
    </li>
  );
}

export function ClientResultsSamplesList({
  jobId,
  selectedSampleId,
  onSelectSample,
}: {
  jobId: string;
  selectedSampleId: string | null;
  onSelectSample: (sampleId: string | null) => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["client-results-samples", jobId],
    queryFn: () => fetchSamples({ job: jobId, page: 1, page_size: 50 }),
    enabled: Boolean(jobId),
    staleTime: 45_000,
  });

  const selectedSample = selectedSampleId
    ? data?.results.find((s) => s.id === selectedSampleId)
    : undefined;

  if (selectedSampleId) {
    if (isLoading && !data) {
      return (
        <section className="mt-4 border-t border-border pt-4">
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading sample…
          </div>
        </section>
      );
    }

    if (selectedSample) {
      return (
        <ClientResultsSampleDetail
          sample={selectedSample}
          jobId={jobId}
          onBack={() => onSelectSample(null)}
        />
      );
    }

    return (
      <section className="mt-4 border-t border-border pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 mb-3 h-8 gap-1 px-2 text-muted-foreground"
          onClick={() => onSelectSample(null)}
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to samples
        </Button>
        <p className="text-sm text-muted-foreground">Sample not found.</p>
      </section>
    );
  }

  return (
    <section className="mt-4 border-t border-border pt-4">
      <h4 className="text-sm font-medium">Samples sent</h4>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Select a sample to view intake details and test progress.
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading samples…
        </div>
      ) : isError ? (
        <p className="py-4 text-sm text-destructive">Could not load samples for this job.</p>
      ) : !data?.results.length ? (
        <p className="py-4 text-sm text-muted-foreground">
          No samples registered yet for this job.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {data.results.map((sample) => (
            <ClientResultsSampleRow
              key={sample.id}
              sample={sample}
              selected={selectedSampleId === sample.id}
              onSelect={() => onSelectSample(sample.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
