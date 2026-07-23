import { Button } from "@/components/ui/button";

type ClientComplaintsSampleFilterBannerProps = {
  sampleLabel: string;
  onClear: () => void;
};

export function ClientComplaintsSampleFilterBanner({
  sampleLabel,
  onClear,
}: ClientComplaintsSampleFilterBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed bg-muted/20 px-3 py-2 text-sm">
      <span className="text-muted-foreground">
        Showing complaints linked to sample{" "}
        <span className="font-medium text-foreground">{sampleLabel}</span>
      </span>
      <Button type="button" variant="ghost" size="sm" onClick={onClear}>
        Clear filter
      </Button>
    </div>
  );
}
