import { JOB_STATUS_LABEL } from "@/lib/job-order-labels";
import { clientJobReferenceLabel } from "@/lib/sample-reference-display";
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

export function paymentStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function clientComplaintsUrl(params?: {
  job?: string | null;
  sample?: string | null;
  complaint?: string | null;
}): string {
  const search = new URLSearchParams();
  if (params?.job) search.set("job", params.job);
  if (params?.sample) search.set("sample", params.sample);
  if (params?.complaint) search.set("complaint", params.complaint);
  const query = search.toString();
  return query ? `/client/complaints?${query}` : "/client/complaints";
}

export function clientResultsJobUrl(jobId: string): string {
  return `/client/results?job=${encodeURIComponent(jobId)}`;
}

const COMPLAINT_REFERENCE_PREFIX = "Reference:";

/** Split stored description into optional reference line and body text. */
export function parseComplaintReference(description: string | null | undefined): {
  reference: string | null;
  body: string;
} {
  const text = description?.trim() ?? "";
  if (!text.startsWith(`${COMPLAINT_REFERENCE_PREFIX} `)) {
    return { reference: null, body: text };
  }

  const withoutPrefix = text.slice(COMPLAINT_REFERENCE_PREFIX.length + 1);
  const splitIndex = withoutPrefix.indexOf("\n\n");
  if (splitIndex === -1) {
    return { reference: withoutPrefix.trim() || null, body: "" };
  }

  return {
    reference: withoutPrefix.slice(0, splitIndex).trim() || null,
    body: withoutPrefix.slice(splitIndex + 2).trim(),
  };
}

/** Prefix optional reference for general complaints (no linked job). */
export function buildComplaintDescription(
  reference: string,
  body: string,
): string {
  const ref = reference.trim();
  const desc = body.trim();
  if (!ref) return desc;
  return `${COMPLAINT_REFERENCE_PREFIX} ${ref}\n\n${desc}`;
}

/** Description text for list cells (body only when reference prefix present). */
export function complaintDescriptionPreview(description: string | null | undefined): string {
  const { body, reference } = parseComplaintReference(description);
  if (body) return body;
  return reference ?? "";
}
