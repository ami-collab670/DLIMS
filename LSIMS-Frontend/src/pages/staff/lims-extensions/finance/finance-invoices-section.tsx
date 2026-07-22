import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useCallback, useMemo, useState, Fragment } from "react";
import { useSearchParams } from "react-router-dom";

import { TableToolbar } from "@/components/data-table/table-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchLabClients } from "@/features/accounts/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { JobRoleHoldBadge } from "@/components/jobs/job-role-hold-badge";
import { fetchRoles } from "@/features/accounts/api";
import { fetchFinancialRecords } from "@/features/laboratory/api";
import { laboratoryQueryKeys } from "@/features/laboratory/query-keys";
import { JOB_PRIORITY_LABEL, JOB_STATUS_LABEL, shortJobId } from "@/lib/laboratory";
import { formatMoney, formatMoneyFromApi, parseMoney } from "@/lib/formatting";
import { clientJobReferenceLabel } from "@/lib/laboratory";
import { isReceptionist } from "@/lib/staff";
import type { FinancialRecord, JobOrder } from "@/types/laboratory";
import { outstandingAmount } from "@/lib/laboratory/finance/dashboard-metrics";
import { FinanceJobBillingBreakdown } from "@/pages/staff/finance/shared/finance-job-billing-breakdown";
import {
  formatPaidAt,
  formatPaymentStatusLabel,
} from "@/lib/laboratory/labels/payment-labels";
import {
  parseJobBillingSummary,
  suggestedInvoiceAmount,
} from "@/lib/laboratory/jobs/billing";
import {
  CreateInvoiceForm,
  EditInvoiceForm,
  MarkPaidButton,
} from "@/pages/staff/finance/shared/finance-invoice-actions";
import { useAuthStore } from "@/stores/auth-store";

import { fetchAwaitingFinanceJobs } from "@/features/laboratory/lib/fetch-awaiting-finance-jobs";
import {
  hasClientSearchQuery,
  matchesClientSearch,
} from "@/lib/staff/receptionist/client-search";
import type { AdminUserRow } from "@/types/account-admin";

export function FinanceInvoicesSection({
  onOpenJob,
}: {
  onOpenJob?: (jobId: string) => void;
} = {}) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const readOnlyFinance = isReceptionist(user);
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

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => fetchRoles(),
    staleTime: 60_000,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: laboratoryQueryKeys.financialRecords(),
    queryFn: () => fetchFinancialRecords({ page: 1 }),
    staleTime: 20_000,
  });

  const { data: awaiting = [], isLoading: awaitingLoading } = useQuery({
    queryKey: ["lims-finance-awaiting"],
    queryFn: fetchAwaitingFinanceJobs,
    staleTime: 15_000,
  });

  const { data: labClients = [] } = useQuery({
    queryKey: ["staff-lab-clients"],
    queryFn: fetchLabClients,
    staleTime: 60_000,
    enabled: readOnlyFinance,
  });

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

  const invoiceByJob = useMemo(() => {
    const map = new Map<string, FinancialRecord>();
    for (const r of data?.results ?? []) {
      if (!map.has(r.job)) map.set(r.job, r);
    }
    return map;
  }, [data?.results]);

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

  const rows = data?.results ?? [];

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

  return (
    <div className="space-y-8">
      {readOnlyFinance && prefillJob ? (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
          <p className="font-medium">Job payment status</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Viewing finance clearance for job{" "}
            <span className="font-mono">{shortJobId(prefillJob)}</span>. Invoice
            create and payment updates are handled by Finance — contact them if
            clearance is delayed.
          </p>
        </div>
      ) : null}

      {readOnlyFinance ? (
        <TableToolbar
          searchId="staff-finance-client-search"
          searchPlaceholder="Search by client name, phone, or email…"
          searchValue={financeSearchInput}
          onSearchChange={setFinanceSearchInput}
        />
      ) : null}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Awaiting finance clearance</h3>
        <p className="text-xs text-muted-foreground">
          {readOnlyFinance
            ? "Jobs waiting on Finance to create an invoice or mark payment. Coordinate with the finance desk — you cannot edit invoices from this role."
            : "Create an invoice for each job, then mark it paid (or approve a discount waiver) to release the job to laboratory intake."}
        </p>
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          {awaitingLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : !showFinanceTables ? (
            <p className="p-6 text-sm text-muted-foreground">
              Search by client name, phone, or email to view finance clearance
              jobs.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-2 font-medium w-8" />
                    <th className="px-4 py-2 font-medium">Reference</th>
                    <th className="px-4 py-2 font-medium">Client</th>
                    <th className="px-4 py-2 font-medium">Priority</th>
                    <th className="px-4 py-2 font-medium">Workflow</th>
                    <th className="px-4 py-2 font-medium">Invoice / payment</th>
                    <th className="px-4 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {filteredAwaiting.map((j) => {
                    const invoice = invoiceByJob.get(j.id);
                    const expanded = expandedAwaitingIds.has(j.id);
                    const refLabel = clientJobReferenceLabel(j.description);
                    return (
                      <Fragment key={j.id}>
                        <tr className="border-b">
                          <td className="px-2 py-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label={expanded ? "Collapse billing" : "Expand billing"}
                              onClick={() => toggleAwaitingExpand(j.id)}
                            >
                              {expanded ? "−" : "+"}
                            </Button>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{refLabel}</span>
                              {onOpenJob && !readOnlyFinance ? (
                                <button
                                  type="button"
                                  className="w-fit font-mono text-xs text-primary hover:underline"
                                  onClick={() => onOpenJob(j.id)}
                                >
                                  {shortJobId(j.id)}
                                </button>
                              ) : (
                                <span className="font-mono text-xs text-muted-foreground">
                                  {shortJobId(j.id)}
                                </span>
                              )}
                              <JobRoleHoldBadge
                                blockedByRole={j.blocked_by_role}
                                roles={roles}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span className="block">{j.client_name || j.client}</span>
                            <span className="text-xs text-muted-foreground">{j.client}</span>
                          </td>
                          <td className="px-4 py-2 text-xs">
                            {JOB_PRIORITY_LABEL[j.priority] ?? j.priority}
                          </td>
                          <td className="px-4 py-2 text-xs text-muted-foreground">
                            {JOB_STATUS_LABEL[j.current_status]}
                          </td>
                          <td className="px-4 py-2 text-xs">
                            {invoice ? (
                              <>
                                <span className="block font-mono">{invoice.invoice_no}</span>
                                <span>{formatPaymentStatusLabel(invoice.payment_status)}</span>
                              </>
                            ) : (
                              "No invoice yet"
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {readOnlyFinance ? (
                              <span className="text-xs text-muted-foreground">
                                {invoice
                                  ? formatPaymentStatusLabel(invoice.payment_status)
                                  : "Awaiting invoice"}
                              </span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {invoice ? (
                                  <>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openEditForJob(j.id)}
                                    >
                                      Edit invoice
                                    </Button>
                                    {invoice.payment_status !== "paid" &&
                                    !invoice.waiver_approved_at ? (
                                      <MarkPaidButton
                                        record={invoice}
                                        queryClient={queryClient}
                                      />
                                    ) : null}
                                  </>
                                ) : (
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => openCreateForJob(j)}
                                  >
                                    Create invoice
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                        {expanded ? (
                          <tr key={`${j.id}-billing`} className="border-b bg-muted/10">
                            <td colSpan={7} className="px-4 py-3">
                              <FinanceJobBillingBreakdown
                                job={j}
                                invoice={invoice}
                                collapsible={false}
                                showMeta={false}
                              />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {showFinanceTables && !awaitingLoading && filteredAwaiting.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              {readOnlyFinance && hasClientSearchQuery(debouncedFinanceSearch)
                ? "No finance clearance jobs match your search."
                : "No jobs are waiting for finance clearance."}
            </p>
          ) : null}
        </div>
      </section>

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
          <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label>Job ID (UUID)</Label>
              <Input value={createJob} onChange={(e) => setCreateJob(e.target.value)} />
            </div>
            {createSuggestedHint ? (
              <p className="text-xs text-muted-foreground md:col-span-2">{createSuggestedHint}</p>
            ) : null}
            <div className="md:col-span-2">
              <CreateInvoiceForm
                jobId={createJob}
                expectedAmount={createExpected}
                onExpectedAmountChange={setCreateExpected}
                onSuccess={handleCreateSuccess}
                queryClient={queryClient}
              />
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="p-4 text-destructive">Could not load financial records.</p>
          ) : !showFinanceTables ? (
            <p className="p-6 text-sm text-muted-foreground">
              Search by client name, phone, or email to view invoices.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-2 font-medium">Invoice</th>
                    <th className="px-4 py-2 font-medium">Job reference</th>
                    <th className="px-4 py-2 font-medium">Client</th>
                    <th className="px-4 py-2 font-medium">Expected</th>
                    <th className="px-4 py-2 font-medium">Paid</th>
                    <th className="px-4 py-2 font-medium">Outstanding</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Paid at</th>
                    <th className="px-4 py-2 font-medium">Waiver</th>
                    {!readOnlyFinance ? (
                      <th className="px-4 py-2 font-medium" />
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => {
                    const linkedJob = jobById.get(r.job);
                    const refLabel = linkedJob
                      ? clientJobReferenceLabel(linkedJob.description)
                      : shortJobId(r.job);
                    return (
                    <tr key={r.invoice_no} className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">{r.invoice_no}</td>
                      <td className="px-4 py-2">
                        <span className="block text-xs font-medium">{refLabel}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {shortJobId(r.job)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {r.job_client_email ?? "—"}
                      </td>
                      <td className="px-4 py-2 tabular-nums">{formatMoneyFromApi(r.amount_expected)}</td>
                      <td className="px-4 py-2 tabular-nums">{formatMoneyFromApi(r.amount_paid)}</td>
                      <td className="px-4 py-2 tabular-nums">
                        {formatMoney(outstandingAmount(r))}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {formatPaymentStatusLabel(r.payment_status)}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {formatPaidAt(r.paid_at)}
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-2 text-xs">
                        {r.waiver_approved_at
                          ? r.waiver_reason || "Approved waiver"
                          : r.payment_required
                            ? "—"
                            : "Not required"}
                      </td>
                      {!readOnlyFinance ? (
                        <td className="px-4 py-2">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditing(r);
                                setEditExpected(r.amount_expected);
                                setEditPaid(r.amount_paid);
                                setEditStatus(r.payment_status);
                              }}
                            >
                              Edit
                            </Button>
                            {r.payment_status !== "paid" && !r.waiver_approved_at ? (
                              <MarkPaidButton record={r} queryClient={queryClient} />
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {showFinanceTables && !isLoading && filteredRows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              {readOnlyFinance && hasClientSearchQuery(debouncedFinanceSearch)
                ? "No invoices match your search."
                : "No invoices yet."}
            </p>
          ) : null}
        </div>

        {!readOnlyFinance && editing ? (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <p className="font-mono text-sm font-medium">{editing.invoice_no}</p>
            <EditInvoiceForm
              record={editing}
              expected={editExpected}
              paid={editPaid}
              status={editStatus}
              onExpectedChange={setEditExpected}
              onPaidChange={setEditPaid}
              onStatusChange={setEditStatus}
              onCancel={() => setEditing(null)}
              onSuccess={handleEditSuccess}
              queryClient={queryClient}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
