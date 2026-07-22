import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateFinancialRecord,
  usePatchFinancialRecord,
} from "@/features/laboratory/hooks";
import type { FinancialRecord, PaymentStatus } from "@/types/laboratory";

import { PAYMENT_STATUS_OPTIONS } from "@/lib/laboratory/labels/payment-labels";

type CreateInvoiceFormProps = {
  jobId: string;
  expectedAmount: string;
  onExpectedAmountChange: (value: string) => void;
  onSuccess?: () => void;
  submitLabel?: string;
};

export function CreateInvoiceForm({
  jobId,
  expectedAmount,
  onExpectedAmountChange,
  onSuccess,
  submitLabel = "Create invoice",
}: CreateInvoiceFormProps) {
  const createMut = useCreateFinancialRecord({
    onSuccess: () => {
      toast.success("Invoice created.");
      onSuccess?.();
    },
  });

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!jobId.trim()) {
          toast.error("Job ID is required.");
          return;
        }
        createMut.mutate({
          job: jobId.trim(),
          amount_expected: expectedAmount.trim() || undefined,
        });
      }}
    >
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="finance-create-expected">Amount expected</Label>
        <Input
          id="finance-create-expected"
          inputMode="decimal"
          placeholder="0.00"
          value={expectedAmount}
          onChange={(e) => onExpectedAmountChange(e.target.value)}
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={createMut.isPending}>
          {createMut.isPending ? <Loader2 className="size-4 animate-spin" /> : submitLabel}
        </Button>
      </div>
    </form>
  );
}

type EditInvoiceFormProps = {
  record: FinancialRecord;
  expected: string;
  paid: string;
  status: PaymentStatus;
  onExpectedChange: (value: string) => void;
  onPaidChange: (value: string) => void;
  onStatusChange: (value: PaymentStatus) => void;
  onCancel: () => void;
  onSuccess?: () => void;
};

export function EditInvoiceForm({
  record,
  expected,
  paid,
  status,
  onExpectedChange,
  onPaidChange,
  onStatusChange,
  onCancel,
  onSuccess,
}: EditInvoiceFormProps) {
  const patchMut = usePatchFinancialRecord({
    onSuccess: () => {
      toast.success("Invoice updated.");
      onSuccess?.();
    },
  });

  const markPaidMut = usePatchFinancialRecord({
    onSuccess: () => {
      toast.success("Invoice marked paid — job advances to laboratory intake.");
      onSuccess?.();
    },
  });

  return (
    <div className="space-y-3">
      {record.waiver_approved_at ? (
        <p className="text-xs text-muted-foreground">
          Waiver approved — payment gate bypassed.
          {record.waiver_reason ? ` ${record.waiver_reason}` : ""}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="finance-edit-expected">Expected</Label>
          <Input
            id="finance-edit-expected"
            value={expected}
            onChange={(e) => onExpectedChange(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="finance-edit-paid">Paid</Label>
          <Input
            id="finance-edit-paid"
            value={paid}
            onChange={(e) => onPaidChange(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="finance-edit-status">Payment status</Label>
          <select
            id="finance-edit-status"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as PaymentStatus)}
          >
            {PAYMENT_STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={patchMut.isPending}
          onClick={() =>
            patchMut.mutate({
              invoiceNo: record.invoice_no,
              body: {
                amount_expected: expected.trim() || undefined,
                amount_paid: paid.trim() || undefined,
                payment_status: status,
              },
            })
          }
        >
          {patchMut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Save invoice"}
        </Button>
        {record.payment_status !== "paid" && !record.waiver_approved_at ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={markPaidMut.isPending}
            onClick={() =>
              markPaidMut.mutate({
                invoiceNo: record.invoice_no,
                body: {
                  amount_paid: record.amount_expected,
                  payment_status: "paid",
                },
              })
            }
          >
            Mark paid
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

type MarkPaidButtonProps = {
  record: FinancialRecord;
  onSuccess?: () => void;
  size?: "default" | "sm" | "lg" | "icon";
};

export function MarkPaidButton({
  record,
  onSuccess,
  size = "sm",
}: MarkPaidButtonProps) {
  const markPaidMut = usePatchFinancialRecord({
    onSuccess: () => {
      toast.success("Invoice marked paid — job advances to laboratory intake.");
      onSuccess?.();
    },
  });

  if (record.payment_status === "paid" || record.waiver_approved_at) {
    return null;
  }

  return (
    <Button
      type="button"
      size={size}
      disabled={markPaidMut.isPending}
      onClick={() =>
        markPaidMut.mutate({
          invoiceNo: record.invoice_no,
          body: {
            amount_paid: record.amount_expected,
            payment_status: "paid",
          },
        })
      }
    >
      {markPaidMut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Mark paid"}
    </Button>
  );
}
