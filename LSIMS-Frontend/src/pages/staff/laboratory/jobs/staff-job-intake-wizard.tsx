import { useMutation, useQuery } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, Dice5, FilePlus2, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { WizardStepNav } from "@/components/data-table/wizard-step-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchLabClients } from "@/features/accounts/lab-clients-api";
import { createStaffJob } from "@/features/jobs/api";
import { ClientServiceCatalogPicker } from "@/features/jobs/client-service-catalog-picker";
import { getDemoClientServiceCatalog } from "@/features/jobs/client-service-catalog-demo";
import {
  buildJobDescription,
  defaultSampleNames,
  MAX_JOB_REQUEST_SAMPLES,
  randomConfirmationCode,
  randomRefId,
  resizeSets,
  resizeStringArray,
  selectedTestsFromIds,
  type MultiSampleMode,
} from "@/features/jobs/job-request-description";
import {
  appendEmptyDepartmentGroups,
  buildClientCatalog,
  sumSelectedPrices,
  type ClientCatalogIndex,
} from "@/features/jobs/service-catalog";
import { fetchClientServiceCatalog } from "@/features/laboratory/test-catalog-api";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatMoney } from "@/lib/money";
import {
  JOB_PRIORITY_LABEL,
  JOB_PRIORITY_OPTIONS,
  shortJobId,
} from "@/lib/job-order-labels";
import { cn } from "@/lib/utils";
import { IntakeChecklistFields } from "@/pages/staff/receptionist/shared/intake-checklist-fields";
import type { JobOrder } from "@/types/laboratory";

import { IntakeClientLookupField } from "./intake-client-lookup-field";
import { TestCatalogBrowseDialog } from "./test-catalog-browse-dialog";

const STEPS = ["Client & scope", "Services", "Review & submit"] as const;

export function StaffJobIntakeWizard({
  onViewJob,
  showIntakeChecklist = false,
  embedded = false,
  onPendingChange,
}: {
  onViewJob: (job: JobOrder) => void;
  showIntakeChecklist?: boolean;
  embedded?: boolean;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const [clientId, setClientId] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [sampleCount, setSampleCount] = useState(1);
  const [multiSampleMode, setMultiSampleMode] = useState<MultiSampleMode>("uniform");
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const [sampleNames, setSampleNames] = useState<string[]>(() => defaultSampleNames(1));
  const [perSampleNotes, setPerSampleNotes] = useState<string[]>([""]);
  const [perSampleSelections, setPerSampleSelections] = useState<Set<string>[]>(() => [
    new Set(),
  ]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [confirmationCode, setConfirmationCode] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [createdJob, setCreatedJob] = useState<JobOrder | null>(null);
  const [clientIdVerified, setClientIdVerified] = useState(false);
  const [packagingOk, setPackagingOk] = useState(false);
  const [catalogDialogOpen, setCatalogDialogOpen] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["lab-clients-picker"],
    queryFn: fetchLabClients,
  });

  const {
    data: catalogData,
    isLoading: catalogLoading,
    isError: catalogError,
    error: catalogErrorDetail,
    refetch: refetchCatalog,
  } = useQuery({
    queryKey: ["client-service-catalog"],
    queryFn: fetchClientServiceCatalog,
    staleTime: 120_000,
  });

  const { groups: catalogGroups, index: catalogIndex } = useMemo(() => {
    if (!catalogData) {
      return {
        groups: [] as ReturnType<typeof buildClientCatalog>["groups"],
        index: new Map() as ClientCatalogIndex,
      };
    }
    const built = buildClientCatalog(catalogData.tests, catalogData.departments);
    if (built.groups.length === 0) {
      const demo = getDemoClientServiceCatalog();
      const demoBuilt = buildClientCatalog(demo.tests, demo.departments);
      return appendEmptyDepartmentGroups(demoBuilt, demo.departments);
    }
    return built;
  }, [catalogData]);

  const selectedListUniform = useMemo(
    () => selectedTestsFromIds(selected, catalogIndex),
    [selected, catalogIndex],
  );

  const subtotalUniform = useMemo(
    () => sumSelectedPrices(selected, catalogIndex),
    [selected, catalogIndex],
  );

  const indicativeTotal = useMemo(() => {
    if (sampleCount === 1 || multiSampleMode === "uniform") {
      return subtotalUniform * sampleCount;
    }
    return perSampleSelections.reduce(
      (sum, set) => sum + sumSelectedPrices(set, catalogIndex),
      0,
    );
  }, [sampleCount, multiSampleMode, subtotalUniform, perSampleSelections, catalogIndex]);

  const reviewGroups = useMemo(() => {
    if (sampleCount === 1 || multiSampleMode === "uniform") {
      return [{ label: null as string | null, tests: selectedListUniform }];
    }
    return sampleNames.map((name, i) => ({
      label: name.trim() || `Sample ${i + 1}`,
      tests: selectedTestsFromIds(perSampleSelections[i] ?? new Set(), catalogIndex),
    }));
  }, [
    sampleCount,
    multiSampleMode,
    sampleNames,
    perSampleSelections,
    catalogIndex,
    selectedListUniform,
  ]);

  const catalogSelection =
    sampleCount >= 2 && multiSampleMode === "distinct"
      ? (perSampleSelections[activeSampleIndex] ?? new Set())
      : selected;

  const mut = useMutation({
    mutationFn: createStaffJob,
    onSuccess: (job) => {
      toast.success("Job order created — send to Finance for invoicing.");
      setCreatedJob(job);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  useEffect(() => {
    onPendingChange?.(mut.isPending);
  }, [mut.isPending, onPendingChange]);

  function resetWizard() {
    setStep(0);
    setClientId("");
    setReferenceId("");
    setPriority("normal");
    setSampleCount(1);
    setMultiSampleMode("uniform");
    setActiveSampleIndex(0);
    setSampleNames(defaultSampleNames(1));
    setPerSampleNotes([""]);
    setPerSampleSelections([new Set()]);
    setSelected(new Set());
    setExtraNotes("");
    setConfirmationCode("");
    setClientIdVerified(false);
    setPackagingOk(false);
    setCreatedJob(null);
  }

  const applySampleCount = (raw: number) => {
    const n = Math.min(MAX_JOB_REQUEST_SAMPLES, Math.max(1, Math.floor(raw) || 1));
    setSampleCount(n);
    setSampleNames((prev) => {
      const base = resizeStringArray(prev, n, "");
      return base.map((s, i) => (s.trim() ? s : `Sample ${i + 1}`));
    });
    setPerSampleNotes((prev) => resizeStringArray(prev, n, ""));
    setPerSampleSelections((prev) => resizeSets(prev, n));
    setActiveSampleIndex((i) => Math.min(i, n - 1));
    if (n === 1) setMultiSampleMode("uniform");
  };

  const namesOk = sampleNames.every((n) => n.trim().length >= 1);

  const servicesStepValid = useMemo(() => {
    if (!namesOk) return false;
    if (sampleCount === 1 || multiSampleMode === "uniform") {
      return selected.size > 0 || extraNotes.trim().length >= 10;
    }
    for (let i = 0; i < sampleCount; i++) {
      const set = perSampleSelections[i] ?? new Set();
      const note = perSampleNotes[i] ?? "";
      if (set.size === 0 && note.trim().length < 10) return false;
    }
    return true;
  }, [
    namesOk,
    sampleCount,
    multiSampleMode,
    selected,
    extraNotes,
    perSampleSelections,
    perSampleNotes,
  ]);

  const canProceedStep0 = Boolean(clientId.trim());
  const canProceedStep1 = servicesStepValid;

  const switchToUniform = () => {
    setMultiSampleMode("uniform");
    setSelected(new Set(perSampleSelections[activeSampleIndex] ?? []));
  };

  const switchToDistinct = () => {
    setMultiSampleMode("distinct");
    setPerSampleSelections(
      Array.from(
        { length: sampleCount },
        (_, i) => (i === 0 ? new Set(selected) : new Set<string>()),
      ),
    );
    setActiveSampleIndex(0);
  };

  const toggleItem = (testId: string) => {
    if (sampleCount >= 2 && multiSampleMode === "distinct") {
      setPerSampleSelections((prev) =>
        prev.map((s, idx) => {
          if (idx !== activeSampleIndex) return s;
          const n = new Set(s);
          if (n.has(testId)) n.delete(testId);
          else n.add(testId);
          return n;
        }),
      );
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(testId)) next.delete(testId);
        else next.add(testId);
        return next;
      });
    }
  };

  const goNext = () => {
    if (step === 0 && !canProceedStep0) {
      toast.error("Select or register a client to continue.");
      return;
    }
    if (step === 0) applySampleCount(sampleCount);
    if (step === 1 && !canProceedStep1) {
      if (!namesOk) {
        toast.error("Enter a name or label for every sample.");
        return;
      }
      toast.error(
        sampleCount === 1 || multiSampleMode === "uniform"
          ? "Select at least one service, or add notes (10+ characters) describing the request."
          : "Each sample needs either selected services or sample notes of at least 10 characters.",
      );
      return;
    }
    if (step === 1) {
      setConfirmationCode((c) => c || randomConfirmationCode());
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const goToStep = (target: number) => {
    if (createdJob) return;
    if (target === step) return;
    if (target < step) {
      setStep(target);
      return;
    }
    if (target === step + 1) {
      goNext();
      return;
    }
    if (target === 2 && step === 0) {
      if (!canProceedStep0) {
        toast.error("Select or register a client to continue.");
        return;
      }
      applySampleCount(sampleCount);
      if (!servicesStepValid) {
        setStep(1);
        toast.error("Complete services on step 2 before review.");
        return;
      }
      setConfirmationCode((c) => c || randomConfirmationCode());
      setStep(2);
    }
  };

  const submitJob = () => {
    const ref = referenceId.trim() || randomRefId();
    const code = confirmationCode || randomConfirmationCode();
    const mode: MultiSampleMode = sampleCount === 1 ? "uniform" : multiSampleMode;
    const selectionGroups =
      sampleCount === 1 || multiSampleMode === "uniform"
        ? [{ label: "shared", ids: [...selected] }]
        : sampleNames.map((label, i) => ({
            label: label.trim() || `Sample ${i + 1}`,
            ids: [...(perSampleSelections[i] ?? new Set())],
          }));

    const description = buildJobDescription({
      referenceId: ref,
      priority,
      confirmationCode: code,
      sampleCount,
      multiSampleMode: mode,
      sampleNames,
      globalNotes: extraNotes,
      perSampleNotes,
      selectionGroups,
      catalogIndex,
    });

    mut.mutate({
      client: clientId,
      current_status: "pending_finance",
      priority,
      description,
    });
  };

  const selectionHint =
    sampleCount >= 2 && multiSampleMode === "distinct"
      ? `sample ${activeSampleIndex + 1}`
      : sampleCount > 1 && multiSampleMode === "uniform"
        ? `${formatMoney(subtotalUniform)} × ${sampleCount} samples`
        : undefined;

  const selectedClient = clients.find((c) => c.id === clientId);

  if (createdJob) {
    return (
      <div className="space-y-6 py-4 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-8" aria-hidden />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Job created</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {shortJobId(createdJob.id)} is ready for Finance invoicing and sample registration.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={() => onViewJob(createdJob)}>
            View job
          </Button>
          <Button type="button" variant="outline" onClick={resetWizard}>
            Create another
          </Button>
        </div>
      </div>
    );
  }

  const wrapperClass = embedded
    ? "space-y-4"
    : "space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm";

  return (
    <section className={wrapperClass} aria-labelledby="staff-intake-wizard-heading">
      <div className="flex items-start gap-3">
        {!embedded ? (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FilePlus2 className="size-5" aria-hidden />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {!embedded ? (
            <>
              <h2 id="staff-intake-wizard-heading" className="font-semibold tracking-tight">
                New job order (intake)
              </h2>
              <p className="text-sm text-muted-foreground">
                Register a client job with catalog selections. Jobs start in{" "}
                <code className="rounded bg-muted px-1">pending_finance</code> — register physical
                samples after the job is created.
              </p>
            </>
          ) : null}
          <WizardStepNav
            steps={STEPS}
            step={step}
            onStepChange={goToStep}
            onNext={goNext}
            onBack={goBack}
            canProceedNext={
              step === 0 ? canProceedStep0 : step === 1 ? canProceedStep1 : true
            }
          />
        </div>
      </div>

      {step === 0 ? (
        <div className="space-y-4">
          <IntakeClientLookupField
            clients={clients}
            clientId={clientId}
            onClientIdChange={setClientId}
          />
          <div className="space-y-1">
            <Label htmlFor="staff-intake-priority">Priority</Label>
            <select
              id="staff-intake-priority"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {JOB_PRIORITY_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desk-ref-id">Desk reference ID (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Client tracking code for this intake — auto-generated if left blank.
            </p>
            <div className="flex gap-2">
              <Input
                id="desk-ref-id"
                className="font-mono"
                placeholder="e.g. PO-2026-0042"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 shrink-0 rounded-full"
                title="Generate a random reference ID"
                aria-label="Generate a random reference ID"
                onClick={() => setReferenceId(randomRefId())}
              >
                <Dice5 className="size-5" aria-hidden />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff-sample-count">Number of samples</Label>
            <p className="text-xs text-muted-foreground">
              Planned sample count for scope and pricing (1–{MAX_JOB_REQUEST_SAMPLES}). Physical
              registration happens after job creation.
            </p>
            <Input
              id="staff-sample-count"
              type="number"
              min={1}
              max={MAX_JOB_REQUEST_SAMPLES}
              className="max-w-[140px] tabular-nums"
              value={sampleCount}
              onChange={(e) => applySampleCount(Number(e.target.value))}
            />
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Select services for this job — show the client the catalog before confirming.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => setCatalogDialogOpen(true)}
            >
              <BookOpen className="size-4" />
              Browse test catalog
            </Button>
          </div>

          {sampleCount >= 2 ? (
            <div className="space-y-2 rounded-lg border border-border bg-muted/10 p-3">
              <Label className="text-sm">Do these samples share the same tests and scope?</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className={cn(
                    "rounded-lg border px-3 py-3 text-left text-sm transition-colors",
                    multiSampleMode === "uniform"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted/40",
                  )}
                  onClick={switchToUniform}
                >
                  <span className="font-medium">Same selections for all</span>
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-lg border px-3 py-3 text-left text-sm transition-colors",
                    multiSampleMode === "distinct"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted/40",
                  )}
                  onClick={switchToDistinct}
                >
                  <span className="font-medium">Different per sample</span>
                </button>
              </div>
            </div>
          ) : null}

          {sampleCount >= 2 && multiSampleMode === "distinct" ? (
            <div className="space-y-3">
              <Label className="text-sm">Which sample are you editing?</Label>
              <div className="flex flex-wrap gap-1.5">
                {sampleNames.map((_, i) => (
                  <Button
                    key={i}
                    type="button"
                    size="sm"
                    variant={activeSampleIndex === i ? "default" : "outline"}
                    onClick={() => setActiveSampleIndex(i)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`staff-sample-name-${activeSampleIndex}`}>
                    Sample {activeSampleIndex + 1} name
                  </Label>
                  <Input
                    id={`staff-sample-name-${activeSampleIndex}`}
                    value={sampleNames[activeSampleIndex] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSampleNames((prev) => {
                        const next = [...prev];
                        next[activeSampleIndex] = v;
                        return next;
                      });
                    }}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`staff-sample-notes-${activeSampleIndex}`}>
                    Notes for this sample only (optional)
                  </Label>
                  <Textarea
                    id={`staff-sample-notes-${activeSampleIndex}`}
                    rows={2}
                    value={perSampleNotes[activeSampleIndex] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPerSampleNotes((prev) => {
                        const next = [...prev];
                        next[activeSampleIndex] = v;
                        return next;
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {sampleCount >= 2 && multiSampleMode === "uniform" ? (
            <div className="space-y-2">
              <Label>Label each sample</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {sampleNames.map((name, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 text-xs tabular-nums text-muted-foreground">
                      {i + 1}.
                    </span>
                    <Input
                      value={name}
                      onChange={(e) => {
                        const v = e.target.value;
                        setSampleNames((prev) => {
                          const next = [...prev];
                          next[i] = v;
                          return next;
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {sampleCount === 1 ? (
            <div className="space-y-2">
              <Label htmlFor="staff-single-sample-name">Sample name</Label>
              <Input
                id="staff-single-sample-name"
                value={sampleNames[0] ?? ""}
                onChange={(e) => setSampleNames([e.target.value])}
                placeholder="e.g. Channel sample — Line 12"
              />
            </div>
          ) : null}

          <ClientServiceCatalogPicker
            groups={catalogGroups}
            index={catalogIndex}
            selectedIds={catalogSelection}
            onToggle={toggleItem}
            isLoading={catalogLoading}
            error={catalogError ? catalogErrorDetail : undefined}
            onRetry={() => void refetchCatalog()}
            selectionHint={selectionHint}
            indicativeTotal={indicativeTotal}
          />

          <div className="space-y-2">
            <Label htmlFor="staff-wizard-notes">Additional notes for the whole job (optional)</Label>
            <Textarea
              id="staff-wizard-notes"
              rows={3}
              placeholder="Deadlines, shipping, contacts, or anything that applies to every sample…"
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
            />
          </div>

          <TestCatalogBrowseDialog
            open={catalogDialogOpen}
            onClose={() => setCatalogDialogOpen(false)}
            onSelectTest={(test) => toggleItem(test.id)}
          />
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
            <p>
              <span className="text-muted-foreground">Client:</span>{" "}
              {selectedClient
                ? `${selectedClient.first_name} ${selectedClient.last_name} (${selectedClient.email})`
                : clientId}
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">Priority:</span>{" "}
              {JOB_PRIORITY_LABEL[priority as keyof typeof JOB_PRIORITY_LABEL] ?? priority}
            </p>
            <p className="mt-1">
              <span className="text-muted-foreground">Samples:</span> {sampleCount}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium">Sample labels</h3>
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border text-sm">
              {sampleNames.map((n, i) => (
                <li key={i} className="px-3 py-2">
                  <span className="tabular-nums text-muted-foreground">{i + 1}. </span>
                  <span className="font-medium">{n.trim() || `Sample ${i + 1}`}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium">Selected services</h3>
            {reviewGroups.some((g) => g.tests.length > 0) ? (
              <div className="mt-2 space-y-3">
                {reviewGroups.map((group, gi) => (
                  <div key={gi}>
                    {group.label ? (
                      <p className="mb-1 text-xs font-medium text-muted-foreground">{group.label}</p>
                    ) : null}
                    {group.tests.length > 0 ? (
                      <ul className="divide-y divide-border rounded-lg border border-border text-sm">
                        {group.tests.map((test) => (
                          <li
                            key={test.id}
                            className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2"
                          >
                            <span className="min-w-0">
                              <span className="font-mono text-xs text-muted-foreground">
                                {test.test_code}
                              </span>
                              <span className="block font-medium">{test.test_name}</span>
                            </span>
                            <span className="font-mono tabular-nums">
                              {formatMoney(test.priceNumber)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                        No catalog lines for this sample — scope is in notes.
                      </p>
                    )}
                  </div>
                ))}
                <div className="flex justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm font-medium">
                  <span>Indicative total</span>
                  <span className="font-mono tabular-nums">{formatMoney(indicativeTotal)}</span>
                </div>
              </div>
            ) : (
              <p className="mt-2 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                No catalog lines — scope is carried in notes.
              </p>
            )}
          </div>

          {showIntakeChecklist ? (
            <IntakeChecklistFields
              clientIdVerified={clientIdVerified}
              onClientIdVerifiedChange={setClientIdVerified}
              packagingOk={packagingOk}
              onPackagingOkChange={setPackagingOk}
            />
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={mut.isPending} onClick={submitJob}>
              {mut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Create job"}
            </Button>
            <Button type="button" variant="outline" disabled={mut.isPending} onClick={resetWizard}>
              Start over
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
