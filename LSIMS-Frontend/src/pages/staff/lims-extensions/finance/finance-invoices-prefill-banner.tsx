import { shortJobId } from "@/lib/laboratory";

type FinanceInvoicesPrefillBannerProps = {
  prefillJob: string;
};

export function FinanceInvoicesPrefillBanner({ prefillJob }: FinanceInvoicesPrefillBannerProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
      <p className="font-medium">Job payment status</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Viewing finance clearance for job{" "}
        <span className="font-mono">{shortJobId(prefillJob)}</span>. Invoice create and payment
        updates are handled by Finance — contact them if clearance is delayed.
      </p>
    </div>
  );
}
