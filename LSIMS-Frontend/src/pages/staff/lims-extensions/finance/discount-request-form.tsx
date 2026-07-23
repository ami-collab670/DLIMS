import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DiscountType } from "@/types/laboratory";

const DISCOUNT_TYPES: { value: DiscountType; label: string }[] = [
  { value: "percentage", label: "Percentage" },
  { value: "fixed_amount", label: "Fixed amount" },
  { value: "free_test", label: "Free test / full waiver" },
];

type DiscountRequestFormProps = {
  showRequest: boolean;
  onToggleShow: () => void;
  requestJob: string;
  onRequestJobChange: (value: string) => void;
  requestType: DiscountType;
  onRequestTypeChange: (value: DiscountType) => void;
  requestPercent: string;
  onRequestPercentChange: (value: string) => void;
  requestAmount: string;
  onRequestAmountChange: (value: string) => void;
  requestReason: string;
  onRequestReasonChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
};

export function DiscountRequestForm({
  showRequest,
  onToggleShow,
  requestJob,
  onRequestJobChange,
  requestType,
  onRequestTypeChange,
  requestPercent,
  onRequestPercentChange,
  requestAmount,
  onRequestAmountChange,
  requestReason,
  onRequestReasonChange,
  onSubmit,
  isPending,
}: DiscountRequestFormProps) {
  return (
    <div className="space-y-2">
      <Button type="button" size="sm" variant="outline" onClick={onToggleShow}>
        {showRequest ? "Cancel request" : "Request discount"}
      </Button>
      {showRequest ? (
        <form
          className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="space-y-1 md:col-span-2">
            <Label>Job ID</Label>
            <Input value={requestJob} onChange={(e) => onRequestJobChange(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Discount type</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={requestType}
              onChange={(e) => onRequestTypeChange(e.target.value as DiscountType)}
            >
              {DISCOUNT_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {requestType === "percentage" ? (
            <div className="space-y-1">
              <Label>Percentage</Label>
              <Input
                inputMode="decimal"
                value={requestPercent}
                onChange={(e) => onRequestPercentChange(e.target.value)}
              />
            </div>
          ) : requestType === "fixed_amount" ? (
            <div className="space-y-1">
              <Label>Amount</Label>
              <Input
                inputMode="decimal"
                value={requestAmount}
                onChange={(e) => onRequestAmountChange(e.target.value)}
              />
            </div>
          ) : null}
          <div className="space-y-1 md:col-span-2">
            <Label>Reason</Label>
            <Textarea
              rows={2}
              value={requestReason}
              onChange={(e) => onRequestReasonChange(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={isPending}>
              Submit request
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
