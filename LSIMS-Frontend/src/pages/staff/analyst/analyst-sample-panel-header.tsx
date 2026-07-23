import { Button } from "@/components/ui/button";

type AnalystSamplePanelHeaderProps = {
  displayCode: string;
  isBlindView: boolean;
  pendingPermanentCode: boolean;
  onClose: () => void;
};

export function AnalystSamplePanelHeader({
  displayCode,
  isBlindView,
  pendingPermanentCode,
  onClose,
}: AnalystSamplePanelHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div>
        <p className="text-xs text-muted-foreground">
          {isBlindView ? "Blind sample" : "Sample"}
        </p>
        <p className="font-mono font-semibold">{displayCode}</p>
        {isBlindView ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Client identifiers are hidden; workflow status follows the parent job.
          </p>
        ) : null}
        {pendingPermanentCode ? (
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            Sample not yet released for laboratory work (permanent code pending).
          </p>
        ) : null}
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={onClose}>
        Close
      </Button>
    </div>
  );
}
