import { EditInvoiceForm } from "@/pages/staff/finance/shared/finance-invoice-actions";
import type { FinancialRecord } from "@/types/laboratory";

type FinanceInvoiceEditPanelProps = {
  record: FinancialRecord;
  expected: string;
  paid: string;
  status: FinancialRecord["payment_status"];
  onExpectedChange: (value: string) => void;
  onPaidChange: (value: string) => void;
  onStatusChange: (status: FinancialRecord["payment_status"]) => void;
  onCancel: () => void;
  onSuccess: () => void;
};

export function FinanceInvoiceEditPanel({
  record,
  expected,
  paid,
  status,
  onExpectedChange,
  onPaidChange,
  onStatusChange,
  onCancel,
  onSuccess,
}: FinanceInvoiceEditPanelProps) {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <p className="font-mono text-sm font-medium">{record.invoice_no}</p>
      <EditInvoiceForm
        record={record}
        expected={expected}
        paid={paid}
        status={status}
        onExpectedChange={onExpectedChange}
        onPaidChange={onPaidChange}
        onStatusChange={onStatusChange}
        onCancel={onCancel}
        onSuccess={onSuccess}
      />
    </div>
  );
}
