import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchJobOrders } from "@/features/jobs/api";
import { createComplaint } from "@/features/laboratory/complaints-api";
import { fetchFinancialRecords } from "@/features/laboratory/financial-records-api";
import { fetchSamples } from "@/features/laboratory/staff-api";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatMoney, parseMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ComplaintCategory, ComplaintRecord } from "@/types/laboratory";

import {
  buildComplaintDescription,
  formatSampleOptionLabel,
  paymentStatusLabel,
} from "./client-complaint-labels";
import {
  ClientJobRequestSelect,
  type ClientJobRequestSelectHandle,
} from "./client-job-request-select";
import { COMPLAINT_CATEGORY_OPTIONS } from "./constants";

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

type RelatedRequestMode = "my_request" | "general";

type ClientComplaintFormProps = {
  defaultJobId?: string | null;
  defaultSampleId?: string | null;
  jobSummary?: { label: string; statusLabel?: string };
  showJobField?: boolean;
  showSampleField?: boolean;
  compact?: boolean;
  onCreated?: (complaint: ComplaintRecord) => void;
};

export function ClientComplaintForm({
  defaultJobId,
  defaultSampleId,
  jobSummary,
  showJobField = true,
  showSampleField = true,
  compact = false,
  onCreated,
}: ClientComplaintFormProps) {
  const queryClient = useQueryClient();
  const jobSelectRef = useRef<ClientJobRequestSelectHandle>(null);
  const [category, setCategory] = useState<ComplaintCategory>("other");
  const [description, setDescription] = useState("");
  const [jobId, setJobId] = useState(defaultJobId ?? "");
  const [sampleId, setSampleId] = useState(defaultSampleId ?? "");
  const [relatedMode, setRelatedMode] = useState<RelatedRequestMode>("my_request");
  const [referenceText, setReferenceText] = useState("");

  useEffect(() => {
    if (defaultJobId) {
      setJobId(defaultJobId);
      setRelatedMode("my_request");
      setReferenceText("");
    }
  }, [defaultJobId]);

  useEffect(() => {
    if (defaultSampleId) {
      setSampleId(defaultSampleId);
    }
  }, [defaultSampleId]);

  const jobsQuery = useQuery({
    queryKey: ["client-complaint-form-jobs"],
    queryFn: () =>
      fetchJobOrders({
        page: 1,
        page_size: 50,
        is_cancelled: false,
        ordering: "-updated_at",
      }),
    enabled: showJobField,
    staleTime: 60_000,
  });

  const samplesQuery = useQuery({
    queryKey: ["client-complaint-form-samples", jobId],
    queryFn: () => fetchSamples({ job: jobId, page_size: 50 }),
    enabled: showSampleField && Boolean(jobId),
    staleTime: 45_000,
  });

  const financeQuery = useQuery({
    queryKey: ["client-complaint-form-finance", jobId],
    queryFn: () => fetchFinancialRecords({ job: jobId }),
    enabled: category === "payment" && Boolean(jobId),
    staleTime: 45_000,
  });

  const jobs = jobsQuery.data?.results ?? [];
  const samples = samplesQuery.data?.results ?? [];
  const invoice = financeQuery.data?.results[0];

  const invoiceSummary = useMemo(() => {
    if (!invoice) return null;
    const expected = parseMoney(invoice.amount_expected);
    const paid = parseMoney(invoice.amount_paid);
    const due = Math.max(0, Math.round((expected - paid) * 100) / 100);
    return {
      invoiceNo: invoice.invoice_no,
      expected,
      paid,
      due,
      status: paymentStatusLabel(invoice.payment_status),
    };
  }, [invoice]);

  const handleJobChange = (nextJobId: string) => {
    setJobId(nextJobId);
    if (!defaultSampleId) {
      setSampleId("");
    }
  };

  const createMut = useMutation({
    mutationFn: () => {
      const isGeneral = relatedMode === "general";
      const finalDescription = isGeneral
        ? buildComplaintDescription(referenceText, description)
        : description.trim();

      return createComplaint({
        job: isGeneral ? null : jobId.trim() || null,
        sample: isGeneral ? null : sampleId.trim() || null,
        category,
        description: finalDescription,
      });
    },
    onSuccess: (complaint) => {
      toast.success("Complaint submitted. Laboratory staff will review it.");
      setDescription("");
      setReferenceText("");
      setRelatedMode("my_request");
      if (!defaultJobId) {
        setJobId("");
      }
      if (!defaultSampleId) {
        setSampleId("");
      }
      setCategory("other");
      void queryClient.invalidateQueries({ queryKey: ["complaints"] });
      onCreated?.(complaint);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showJobField && relatedMode === "my_request" && !jobSelectRef.current?.commitPending()) {
      return;
    }
    if (description.trim().length < 10) {
      toast.error("Please describe the issue (at least 10 characters).");
      return;
    }
    if (
      showJobField &&
      relatedMode === "my_request" &&
      jobId.trim() &&
      !jobs.some((job) => job.id === jobId.trim())
    ) {
      toast.error("Select a valid request from the list or enter a valid request ID.");
      return;
    }
    createMut.mutate();
  };

  const switchToGeneralMode = () => {
    setRelatedMode("general");
    if (!defaultJobId) {
      setJobId("");
    }
    if (!defaultSampleId) {
      setSampleId("");
    }
  };

  const switchToMyRequestMode = () => {
    setRelatedMode("my_request");
    setReferenceText("");
  };

  return (
    <form
      className={
        compact
          ? "space-y-3"
          : "grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-2"
      }
      onSubmit={handleSubmit}
    >
      {!showJobField && jobSummary ? (
        <div
          className={cn(
            "rounded-lg border border-border bg-muted/20 px-3 py-2",
            compact ? undefined : "md:col-span-2",
          )}
        >
          <p className="text-xs text-muted-foreground">Linked request</p>
          <p className="text-sm font-medium">{jobSummary.label}</p>
          {jobSummary.statusLabel ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {jobSummary.statusLabel}
            </p>
          ) : null}
        </div>
      ) : null}

      {showJobField ? (
        <div
          className={cn(
            "space-y-3",
            compact ? undefined : "md:col-span-2",
          )}
        >
          {!defaultJobId ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={relatedMode === "my_request" ? "default" : "outline"}
                onClick={switchToMyRequestMode}
              >
                My request
              </Button>
              <Button
                type="button"
                size="sm"
                variant={relatedMode === "general" ? "default" : "outline"}
                onClick={switchToGeneralMode}
              >
                General complaint
              </Button>
            </div>
          ) : null}

          <div
            className={cn(
              "grid gap-3",
              compact ? "grid-cols-1" : "md:grid-cols-2 md:items-end",
            )}
          >
            <div className="space-y-1">
              <Label htmlFor={relatedMode === "general" ? "complaint-reference" : "complaint-job"}>
                Related request (optional)
              </Label>
              {relatedMode === "my_request" ? (
                jobsQuery.isLoading ? (
                  <div className="flex h-9 items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Loading your requests…
                  </div>
                ) : (
                  <ClientJobRequestSelect
                    ref={jobSelectRef}
                    id="complaint-job"
                    value={jobId}
                    onChange={handleJobChange}
                    jobs={jobs}
                    disabled={Boolean(defaultJobId)}
                  />
                )
              ) : (
                <Input
                  id="complaint-reference"
                  className="h-9"
                  value={referenceText}
                  onChange={(event) => setReferenceText(event.target.value)}
                  placeholder="Invoice number, visit date, or other reference…"
                />
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="complaint-category">Category</Label>
              <select
                id="complaint-category"
                className={selectClassName}
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
              >
                {COMPLAINT_CATEGORY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {relatedMode === "my_request" && !defaultJobId ? (
            <button
              type="button"
              className="text-xs text-primary hover:underline"
              onClick={switchToGeneralMode}
            >
              Can&apos;t find your request?
            </button>
          ) : null}

          {relatedMode === "general" ? (
            <p className="text-xs text-muted-foreground">
              Use for invoice numbers, visit dates, or issues not tied to a request in your
              account.
            </p>
          ) : null}
        </div>
      ) : (
        <div className={compact ? "space-y-1" : "space-y-1 md:col-span-1"}>
          <Label htmlFor="complaint-category">Category</Label>
          <select
            id="complaint-category"
            className={selectClassName}
            value={category}
            onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
          >
            {COMPLAINT_CATEGORY_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {showSampleField && relatedMode === "my_request" && jobId ? (
        <div className={compact ? "space-y-1" : "space-y-1 md:col-span-2"}>
          <Label htmlFor="complaint-sample">Related sample (optional)</Label>
          {samplesQuery.isLoading ? (
            <div className="flex h-9 items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading samples…
            </div>
          ) : samples.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No samples registered for this request yet.
            </p>
          ) : (
            <select
              id="complaint-sample"
              className={selectClassName}
              value={sampleId}
              onChange={(e) => setSampleId(e.target.value)}
              disabled={Boolean(defaultSampleId)}
            >
              <option value="">No specific sample</option>
              {samples.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  {formatSampleOptionLabel(sample)}
                </option>
              ))}
            </select>
          )}
        </div>
      ) : null}

      {category === "payment" && relatedMode === "my_request" && jobId ? (
        <div className={compact ? "space-y-1" : "space-y-1 md:col-span-2"}>
          <p className="text-xs font-medium text-muted-foreground">Invoice context</p>
          {financeQuery.isLoading ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading invoice…
            </div>
          ) : invoiceSummary ? (
            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
              <p>
                Invoice <span className="font-mono">{invoiceSummary.invoiceNo}</span> ·{" "}
                {invoiceSummary.status}
              </p>
              <p className="mt-1 text-muted-foreground">
                Expected {formatMoney(invoiceSummary.expected)} · Paid{" "}
                {formatMoney(invoiceSummary.paid)} · Due{" "}
                <span className="font-medium text-foreground">
                  {formatMoney(invoiceSummary.due)}
                </span>
              </p>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
              No invoice found for this request yet.
            </p>
          )}
        </div>
      ) : null}

      <div className={compact ? "space-y-1" : "space-y-1 md:col-span-2"}>
        <Label htmlFor="complaint-description">Description</Label>
        <Textarea
          id="complaint-description"
          rows={compact ? 3 : 4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What went wrong?"
        />
      </div>
      <div className={compact ? undefined : "md:col-span-2"}>
        <Button type="submit" size={compact ? "sm" : "default"} disabled={createMut.isPending}>
          Submit complaint
        </Button>
      </div>
    </form>
  );
}
