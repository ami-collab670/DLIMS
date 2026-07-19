import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { TableToolbar } from "@/components/data-table/table-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchLabClients } from "@/features/accounts/lab-clients-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { JobRoleHoldBadge } from "@/components/jobs/job-role-hold-badge";
import { fetchRoles } from "@/features/accounts/roles-api";
import {
  createFinancialRecord,
  fetchFinancialRecords,
  patchFinancialRecord,
} from "@/features/laboratory/financial-records-api";
import { laboratoryQueryKeys } from "@/features/laboratory/laboratory-query-keys";
import { getApiErrorMessage } from "@/lib/api-error";
import { JOB_STATUS_LABEL, shortJobId } from "@/lib/job-order-labels";
import { isReceptionist } from "@/lib/staff-permissions";
import type { FinancialRecord, JobOrder, PaymentStatus } from "@/types/laboratory";
import { useAuthStore } from "@/stores/auth-store";

import { dashboardKeys } from "@/pages/staff/dashboard-home/dashboard-api-keys";
import { fetchAwaitingFinanceJobs } from "@/pages/staff/receptionist/shared/fetch-awaiting-finance-jobs";
import {
  hasClientSearchQuery,
  matchesClientSearch,
} from "@/pages/staff/receptionist/shared/client-search-utils";
import type { AdminUserRow } from "@/types/account-admin";

const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
];

/** Invalidate caches that depend on payment gate / job workflow. */
export function invalidateFinanceWorkflowQueries(
  queryClient: QueryClient,
  jobId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: ["financial-records"] });
  void queryClient.invalidateQueries({ queryKey: ["staff-job-orders"] });
  void queryClient.invalidateQueries({ queryKey: ["staff-jobs-picker"] });
  void queryClient.invalidateQueries({ queryKey: ["staff-samples"] });
  void queryClient.invalidateQueries({ queryKey: ["staff-analyst"] });
  void queryClient.invalidateQueries({ queryKey: ["client-job-orders"] });
  void queryClient.invalidateQueries({ queryKey: ["lims-finance-awaiting"] });
  void queryClient.invalidateQueries({ queryKey: ["staff-dashboard"] });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.recentJobs });
  if (jobId) {
    void queryClient.invalidateQueries({
      queryKey: laboratoryQueryKeys.financialRecords({ job: jobId }),
    });
    void queryClient.invalidateQueries({ queryKey: ["staff-job-order", jobId] });
  }
}

export function FinanceInvoicesSection() {
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
  const [editStatus, setEditStatus] = useState<PaymentStatus>("pending");
  const [financeSearchInput, setFinanceSearchInput] = useState("");
  const debouncedFinanceSearch = useDebouncedValue(financeSearchInput);

  useEffect(() => {
    if (prefillJob && !readOnlyFinance) {
      setCreateJob(prefillJob);
      setShowCreate(true);
    }
  }, [prefillJob, readOnlyFinance]);

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

  const invalidate = (jobId?: string) =>
    invalidateFinanceWorkflowQueries(queryClient, jobId);

  const createMut = useMutation({
    mutationFn: () =>
      createFinancialRecord({
        job: createJob.trim(),
        amount_expected: createExpected.trim() || undefined,
      }),
    onSuccess: (_record, _vars, _ctx) => {
      toast.success("Invoice created.");
      const jobId = createJob.trim();
      setShowCreate(false);
      setCreateJob("");
      setCreateExpected("");
      if (prefillJob) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("job");
          return next;
        });
      }
      invalidate(jobId);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const patchMut = useMutation({
    mutationFn: () =>
      patchFinancialRecord(editing!.invoice_no, {
        amount_expected: editExpected.trim() || undefined,
        amount_paid: editPaid.trim() || undefined,
        payment_status: editStatus,
      }),
    onSuccess: () => {
      toast.success("Invoice updated.");
      const jobId = editing!.job;
      setEditing(null);
      invalidate(jobId);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const markPaidMut = useMutation({
    mutationFn: (record: FinancialRecord) =>
      patchFinancialRecord(record.invoice_no, {
        amount_paid: record.amount_expected,
        payment_status: "paid",
      }),
    onSuccess: (_data, record) => {
      toast.success("Invoice marked paid — job advances to laboratory intake.");
      invalidate(record.job);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const rows = data?.results ?? [];

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
    setCreateExpected("");
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
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-2 font-medium">Job</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Client</th>
                    <th className="px-4 py-2 font-medium">Invoice</th>
                    <th className="px-4 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {filteredAwaiting.map((j) => {
                    const invoice = invoiceByJob.get(j.id);
                    return (
                      <tr key={j.id} className="border-b">
                        <td className="px-4 py-2 font-mono text-xs">
                          <div className="flex flex-col gap-1">
                            {shortJobId(j.id)}
                            <JobRoleHoldBadge
                              blockedByRole={j.blocked_by_role}
                              roles={roles}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">
                          {JOB_STATUS_LABEL[j.current_status]}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{j.client}</td>
                        <td className="px-4 py-2 font-mono text-xs">
                          {invoice ? invoice.invoice_no : "—"}
                        </td>
                        <td className="px-4 py-2">
                          {readOnlyFinance ? (
                            <span className="text-xs text-muted-foreground">
                              {invoice
                                ? `Status: ${invoice.payment_status}`
                                : "No invoice yet"}
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
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={markPaidMut.isPending}
                                      onClick={() => markPaidMut.mutate(invoice)}
                                    >
                                      Mark paid
                                    </Button>
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
          <form
            className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!createJob.trim()) {
                toast.error("Job ID is required.");
                return;
              }
              createMut.mutate();
            }}
          >
            <div className="space-y-1">
              <Label>Job ID (UUID)</Label>
              <Input value={createJob} onChange={(e) => setCreateJob(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Amount expected</Label>
              <Input
                inputMode="decimal"
                placeholder="0.00"
                value={createExpected}
                onChange={(e) => setCreateExpected(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={createMut.isPending}>
                Create invoice
              </Button>
            </div>
          </form>
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
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-2 font-medium">Invoice</th>
                    <th className="px-4 py-2 font-medium">Job</th>
                    <th className="px-4 py-2 font-medium">Expected</th>
                    <th className="px-4 py-2 font-medium">Paid</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Gate</th>
                    <th className="px-4 py-2 font-medium">Waiver</th>
                    {!readOnlyFinance ? (
                      <th className="px-4 py-2 font-medium" />
                    ) : null}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => (
                    <tr key={r.invoice_no} className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">{r.invoice_no}</td>
                      <td className="px-4 py-2 font-mono text-xs">{shortJobId(r.job)}</td>
                      <td className="px-4 py-2 tabular-nums">{r.amount_expected}</td>
                      <td className="px-4 py-2 tabular-nums">{r.amount_paid}</td>
                      <td className="px-4 py-2 capitalize">{r.payment_status}</td>
                      <td className="px-4 py-2 text-xs">
                        {r.payment_required ? "Payment required" : "Waived"}
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-2 text-xs">
                        {r.waiver_approved_at
                          ? r.waiver_reason || "Approved waiver"
                          : "—"}
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
                              <Button
                                type="button"
                                size="sm"
                                disabled={markPaidMut.isPending}
                                onClick={() => markPaidMut.mutate(r)}
                              >
                                Mark paid
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
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
            {editing.waiver_approved_at ? (
              <p className="text-xs text-muted-foreground">
                Waiver approved — payment gate bypassed.
                {editing.waiver_reason ? ` ${editing.waiver_reason}` : ""}
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>Expected</Label>
                <Input
                  value={editExpected}
                  onChange={(e) => setEditExpected(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Paid</Label>
                <Input value={editPaid} onChange={(e) => setEditPaid(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Payment status</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as PaymentStatus)}
                >
                  {PAYMENT_STATUSES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={patchMut.isPending}
                onClick={() => patchMut.mutate()}
              >
                Save
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
