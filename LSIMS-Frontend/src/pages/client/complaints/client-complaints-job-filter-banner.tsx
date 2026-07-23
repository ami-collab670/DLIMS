import { Button } from "@/components/ui/button";
import { shortJobId } from "@/lib/laboratory";

type ClientComplaintsJobFilterBannerProps = {
  jobFilter: string;
  jobLabel: string | undefined;
  onClear: () => void;
};

export function ClientComplaintsJobFilterBanner({
  jobFilter,
  jobLabel,
  onClear,
}: ClientComplaintsJobFilterBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-sm">
      <span className="text-muted-foreground">
        Showing complaints linked to request{" "}
        <span className="font-medium text-foreground">
          {jobLabel ?? shortJobId(jobFilter)}
        </span>
      </span>
      <Button type="button" variant="ghost" size="sm" onClick={onClear}>
        Clear filter
      </Button>
    </div>
  );
}
