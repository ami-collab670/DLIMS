import { useEffect, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { TableToolbar } from "@/components/data-table/table-toolbar";
import { Button } from "@/components/ui/button";
import { useLabClients, useRoles } from "@/features/accounts/hooks";
import {
  useAllFinancialRecords,
  useAwaitingFinanceJobs,
} from "@/features/laboratory/hooks";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatMoney, parseMoney } from "@/lib/formatting";
import { isFinance, isStaffAdmin } from "@/lib/staff";
import type { FinancialRecord, JobOrder } from "@/types/laboratory";
import { invoiceByJobMap } from "@/lib/laboratory/finance/dashboard-metrics";
import {
  parseJobBillingSummary,
  suggestedInvoiceAmount,
} from "@/lib/laboratory/jobs/billing";
import { useAuthStore } from "@/stores/auth-store";

import {
  hasClientSearchQuery,
  matchesClientSearch,
} from "@/lib/staff/receptionist/client-search";
import type { AdminUserRow } from "@/types/account-admin";

import { FinanceAwaitingClearanceTable } from "./finance-awaiting-clearance-table";
import { FinanceInvoiceCreatePanel } from "./finance-invoice-create-panel";
import { FinanceInvoiceEditPanel } from "./finance-invoice-edit-panel";
import { FinanceInvoicesPrefillBanner } from "./finance-invoices-prefill-banner";
import { FinanceInvoicesTable } from "./finance-invoices-table";

export function FinanceInvoicesSection({
  onOpenJob,
}: {
  onOpenJob?: (jobId: string) => void;
} = {}) {
  const user = useAuthStore((s) => s.user);
  const readOnlyFinance = !(isFinance(user) || isStaffAdmin(user));
  const [searchParams, setSearchParams] = useSearchParams();
  const prefillJob = searchParams.get("job") ?? "";

  const [showCreate, setShowCreate] = useState(false);
  const [createJob, setCreateJob] = useState("");
  const [createExpected, setCreateExpected] = useState("");
  const [editing, setEditing] = useState<FinancialRecord | null>(null);
  const [editPaid, setEditPaid] = useState("");
  const [editExpected, setEditExpected] = useState("");
  const [editStatus, setEditStatus] = useState<FinancialRecord["payment_status"]>("pending");
  const [financeSearchInput, setFinanceSearchInput] = useState("");
  const debouncedFinanceSearch = useDebouncedValue(financeSearchInput);
  const [expandedAwaitingIds, setExpandedAwaitingIds] = useState<Set<string>>(new Set());
  const [createSuggestedHint, setCreateSuggestedHint] = useState("");

  useEffect(() => {
    if (prefillJob && !readOnlyFinance) {
      setCreateJob(prefillJob);
      setShowCreate(true);
      if (onOpenJob) {
        onOpenJob(prefillJob);
      }
    }
  }, [prefillJob, readOnlyFinance, onOpenJob]);

  const { data: roles = [] } = useRoles();

  const { data: records = [], isLoading, isError } = useAllFinancialRecords();

  const { data: awaiting = [], isLoading: awaitingLoading } = useAwaitingFinanceJobs();

  const { data: labClients = [] } = useLabClients({ enabled: readOnlyFinance });

  const clientByEmail = useMemo(() => {
    const map = new Map<string, AdminUserRow>();
    for (const client of labClients) {
      map.set(client.email.trim().toLowerCase(), client);
    }
    return map;
  }, [labClients]);

  const showFinanceTables =
    !readOnlyFinance || hasClientSearchQuery(debouncedFinanceSearch);

  const clientFieldsForEmail = useCallback(
    (email: string | undefined) => {
      const normalized = email?.trim().toLowerCase() ?? "";
      const client = clientByEmail.get(normalized);
      const contact = client
        ? [client.first_name, client.last_name].filter(Boolean).join(" ").trim()
        : "";
      return {
        email,
        name: contact || undefined,
        phone: client?.phone,
        organization: client?.organization_name,
      };
    },
    [clientByEmail],
  );

  const filteredAwaiting = useMemo(() => {
    if (!readOnlyFinance || !hasClientSearchQuery(debouncedFinanceSearch)) {
      return awaiting;
    }
    return awaiting.filter((job) =>
      matchesClientSearch(debouncedFinanceSearch, {
        ...clientFieldsForEmail(job.client),
        name: job.client_name || clientFieldsForEmail(job.client).name,
      }),
    );
  }, [awaiting, clientFieldsForEmail, debouncedFinanceSearch, readOnlyFinance]);

  const invoiceByJob = useMemo(() => invoiceByJobMap(records), [records]);

  const jobById = useMemo(() => {
    const map = new Map<string, JobOrder>();
    for (const j of awaiting) {
      map.set(j.id, j);
    }
    return map;
  }, [awaiting]);

  function toggleAwaitingExpand(jobId: string) {
    setExpandedAwaitingIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  }

  const applySuggestedAmount = useCallback((job: JobOrder) => {
    const summary = parseJobBillingSummary(job.description);
    const suggested = suggestedInvoiceAmount(summary);
    setCreateExpected(suggested);
    setCreateSuggestedHint(
      suggested ? `Suggested from catalog total (${formatMoney(parseMoney(suggested))}).` : "",
    );
  }, []);

  useEffect(() => {
    if (!createJob.trim()) return;
    const job = jobById.get(createJob.trim());
    if (job) applySuggestedAmount(job);
  }, [createJob, jobById, applySuggestedAmount]);

  const rows = records;

  function handleCreateSuccess() {
    setShowCreate(false);
    setCreateJob("");
    setCreateExpected("");
    setCreateSuggestedHint("");
    if (prefillJob) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("job");
        return next;
      });
    }
  }

  function handleEditSuccess() {
    setEditing(null);
  }

  const filteredRows = useMemo(() => {
    if (!readOnlyFinance || !hasClientSearchQuery(debouncedFinanceSearch)) {
      return rows;
    }
    return rows.filter((record) =>
      matchesClientSearch(
        debouncedFinanceSearch,
        clientFieldsForEmail(record.job_client_email),
      ),
    );
  }, [clientFieldsForEmail, debouncedFinanceSearch, readOnlyFinance, rows]);

  function openCreateForJob(job: JobOrder) {
    setCreateJob(job.id);
    applySuggestedAmount(job);
    setShowCreate(true);
    setEditing(null);
  }

  function openEditForJob(jobId: string) {
    const record = invoiceByJob.get(jobId);
    if (record) {
      setEditing(record);
      setEditExpected(record.amount_expected);
      setEditPaid(record.amount_paid);
      setEditStatus(record.payment_status);
      setShowCreate(false);
    }
  }

  function openEditRecord(record: FinancialRecord) {
    setEditing(record);
    setEditExpected(record.amount_expected);
    setEditPaid(record.amount_paid);
    setEditStatus(record.payment_status);
    setShowCreate(false);
  }

  return (
    <div className="space-y-8">
      {readOnlyFinance && prefillJob ? (
        <FinanceInvoicesPrefillBanner prefillJob={prefillJob} />
      ) : null}

      {readOnlyFinance ? (
        <TableToolbar
          searchId="staff-finance-client-search"
          searchPlaceholder="Search by client name, phone, or email…"
          searchValue={financeSearchInput}
          onSearchChange={setFinanceSearchInput}
        />
      ) : null}

      <FinanceAwaitingClearanceTable
        readOnlyFinance={readOnlyFinance}
        showFinanceTables={showFinanceTables}
        debouncedFinanceSearch={debouncedFinanceSearch}
        awaitingLoading={awaitingLoading}
        filteredAwaiting={filteredAwaiting}
        invoiceByJob={invoiceByJob}
        expandedAwaitingIds={expandedAwaitingIds}
        onToggleAwaitingExpand={toggleAwaitingExpand}
        roles={roles}
        onOpenJob={onOpenJob}
        onOpenCreateForJob={openCreateForJob}
        onOpenEditForJob={openEditForJob}
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {readOnlyFinance
              ? "Read-only invoice list. Payment status drives workflow — job status is read-only on the API."
              : "Financial records keyed by invoice number. Payment status drives workflow — job status is read-only on the API."}
          </p>
          {!readOnlyFinance ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowCreate((s) => !s)}
            >
              {showCreate ? "Cancel" : "New invoice"}
            </Button>
          ) : null}
        </div>

        {!readOnlyFinance && showCreate ? (
          <FinanceInvoiceCreatePanel
            createJob={createJob}
            onCreateJobChange={setCreateJob}
            createExpected={createExpected}
            onCreateExpectedChange={setCreateExpected}
            createSuggestedHint={createSuggestedHint}
            onSuccess={handleCreateSuccess}
          />
        ) : null}

        <FinanceInvoicesTable
          readOnlyFinance={readOnlyFinance}
          showFinanceTables={showFinanceTables}
          debouncedFinanceSearch={debouncedFinanceSearch}
          isLoading={isLoading}
          isError={isError}
          filteredRows={filteredRows}
          jobById={jobById}
          onEditRecord={openEditRecord}
        />

        {!readOnlyFinance && editing ? (
          <FinanceInvoiceEditPanel
            record={editing}
            expected={editExpected}
            paid={editPaid}
            status={editStatus}
            onExpectedChange={setEditExpected}
            onPaidChange={setEditPaid}
            onStatusChange={setEditStatus}
            onCancel={() => setEditing(null)}
            onSuccess={handleEditSuccess}
          />
        ) : null}
      </section>
    </div>
  );
}
