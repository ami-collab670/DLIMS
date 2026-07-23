import type { PreparationRecord } from "@/types/laboratory";

type AnalystSamplePrepStatusBannerProps = {
  prepRecord: PreparationRecord;
  formatDisplayDateTime: (iso: string | null | undefined) => string;
};

export function AnalystSamplePrepStatusBanner({
  prepRecord,
  formatDisplayDateTime,
}: AnalystSamplePrepStatusBannerProps) {
  return (
    <div className="mt-3 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs">
      <span className="font-medium text-foreground">Prep status: </span>
      <span className="capitalize">{prepRecord.status.replace(/_/g, " ")}</span>
      {prepRecord.completed_at ? (
        <span className="text-muted-foreground">
          {" "}
          · completed {formatDisplayDateTime(prepRecord.completed_at)}
        </span>
      ) : null}
    </div>
  );
}
