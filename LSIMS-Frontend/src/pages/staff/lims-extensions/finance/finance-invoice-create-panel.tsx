import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateInvoiceForm } from "@/pages/staff/finance/shared/finance-invoice-actions";

type FinanceInvoiceCreatePanelProps = {
  createJob: string;
  onCreateJobChange: (value: string) => void;
  createExpected: string;
  onCreateExpectedChange: (value: string) => void;
  createSuggestedHint: string;
  onSuccess: () => void;
};

export function FinanceInvoiceCreatePanel({
  createJob,
  onCreateJobChange,
  createExpected,
  onCreateExpectedChange,
  createSuggestedHint,
  onSuccess,
}: FinanceInvoiceCreatePanelProps) {
  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2">
      <div className="space-y-1 md:col-span-2">
        <Label>Job ID (UUID)</Label>
        <Input value={createJob} onChange={(e) => onCreateJobChange(e.target.value)} />
      </div>
      {createSuggestedHint ? (
        <p className="text-xs text-muted-foreground md:col-span-2">{createSuggestedHint}</p>
      ) : null}
      <div className="md:col-span-2">
        <CreateInvoiceForm
          jobId={createJob}
          expectedAmount={createExpected}
          onExpectedAmountChange={onCreateExpectedChange}
          onSuccess={onSuccess}
        />
      </div>
    </div>
  );
}
