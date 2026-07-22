import { JOB_STATUS_LABEL, clientJobReferenceLabel } from "@/lib/laboratory";
import type { JobOrder, SampleRecord } from "@/types/laboratory";

export function formatJobOptionLabel(job: JobOrder): string {
  const reference = clientJobReferenceLabel(job.description);
  const status = JOB_STATUS_LABEL[job.current_status] ?? job.current_status;
  const samples =
    job.sample_count > 0
      ? ` · ${job.sample_count} sample${job.sample_count === 1 ? "" : "s"}`
      : "";
  return `${reference} · ${status}${samples}`;
}

export function formatSampleOptionLabel(sample: SampleRecord): string {
  const name = sample.sample_name?.trim() || "Unnamed sample";
  const status = JOB_STATUS_LABEL[sample.sample_status as keyof typeof JOB_STATUS_LABEL]
    ?? sample.sample_status;
  return `${name} · ${status}`;
}

export function formatSampleDisplayName(sample: SampleRecord | undefined): string {
  if (!sample) return "Linked sample";
  return sample.sample_name?.trim() || "Unnamed sample";
}
