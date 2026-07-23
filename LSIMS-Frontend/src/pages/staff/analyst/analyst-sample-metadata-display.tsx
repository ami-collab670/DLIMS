import { shortJobId } from "@/lib/laboratory";
import type { SampleRecord } from "@/types/laboratory";

type AnalystSampleMetadataDisplayProps = {
  sample: SampleRecord;
  isBlindView: boolean;
  hideClientSampleNames: boolean;
  canPatchSample: boolean;
  formatDisplayDate: (isoOrDate: string | null | undefined) => string;
  formatDisplayDateTime: (iso: string | null | undefined) => string;
};

export function AnalystSampleMetadataDisplay({
  sample,
  isBlindView,
  hideClientSampleNames,
  canPatchSample,
  formatDisplayDate,
  formatDisplayDateTime,
}: AnalystSampleMetadataDisplayProps) {
  return (
    <>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        {!isBlindView && !hideClientSampleNames && sample.sample_name ? (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Name</dt>
            <dd>{sample.sample_name}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs text-muted-foreground">Workflow status</dt>
          <dd className="capitalize">{sample.sample_status.replace(/_/g, " ")}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Blind code</dt>
          <dd className="font-mono">{sample.blind_alias_code ?? "—"}</dd>
        </div>
        {sample.job ? (
          <div>
            <dt className="text-xs text-muted-foreground">Job</dt>
            <dd className="font-mono text-xs">{shortJobId(sample.job)}</dd>
          </div>
        ) : null}
        {sample.job_status ? (
          <div>
            <dt className="text-xs text-muted-foreground">Job status</dt>
            <dd className="capitalize">{sample.job_status.replace(/_/g, " ")}</dd>
          </div>
        ) : null}
      </dl>

      {!canPatchSample ? (
        <div className="mt-4 space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Technical details</p>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Sample weight (g)</dt>
              <dd>
                {sample.sample_weight != null && sample.sample_weight !== ""
                  ? sample.sample_weight
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Packaging</dt>
              <dd>{sample.packaging_type?.trim() ? sample.packaging_type : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Collection date</dt>
              <dd>{formatDisplayDate(sample.collection_date)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Assigned at</dt>
              <dd>{formatDisplayDateTime(sample.assigned_at)}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </>
  );
}
