import type { PaymentStatus } from "@/types/laboratory";

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Awaiting payment",
  partial: "Partially paid",
  paid: "Paid in full",
};

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = (
  Object.entries(PAYMENT_STATUS_LABEL) as [PaymentStatus, string][]
).map(([value, label]) => ({ value, label }));

export function formatPaymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUS_LABEL[status] ?? status;
}

export function formatPaidAt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}
