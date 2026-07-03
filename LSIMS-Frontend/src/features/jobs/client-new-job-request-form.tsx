import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Dice5,
  FilePlus2,
} from "lucide-react";import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { WizardStepNav } from "@/components/data-table/wizard-step-nav";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClientJobRequest } from "@/features/jobs/api";
import { fetchActiveTestCatalog } from "@/features/laboratory/test-catalog-api";
import { getApiErrorMessage } from "@/lib/api-error";
import { qrTextToDataUrl } from "@/lib/qr-data-url";
import {
  JOB_PRIORITY_LABEL,
  JOB_PRIORITY_OPTIONS,
} from "@/lib/job-order-labels";
import { cn } from "@/lib/utils";
import {
  clientJobRequestSchema,
  type ClientJobRequestValues,
} from "@/schemas/job-request";
import type { JobOrder } from "@/types/laboratory";

import {
  CATALOG_SECTIONS,
  CLIENT_SERVICE_CATALOG,
  itemKey,
  lookupItemPrice,
  parseItemKey,
  type ClientServiceCatalog,
} from "./service-catalog";

const MAX_SAMPLES = 50;

type MultiSampleMode = "uniform" | "distinct";

type Props = {
  onCreated?: (job: JobOrder) => void;
};

function RequestSummaryQr({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    setDataUrl(null);
    void qrTextToDataUrl(value)
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl(null);
          setLoadError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (loadError) {
    return (
      <div className="flex size-[180px] flex-col items-center justify-center rounded-md border border-dashed border-border bg-muted/30 p-2 text-center text-xs text-muted-foreground">
        QR could not be loaded (offline or blocked). Use “Copy summary” below.
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className="size-[180px] animate-pulse rounded-md bg-muted"
        role="status"
        aria-label="Generating QR code"
      />
    );
  }
  return (
    <img
      src={dataUrl}
      alt="Request summary QR code"
      width={180}
      height={180}
      decoding="async"
      className="size-[180px]"
    />
  );
}

const STEPS = ["Reference", "Services", "Review & submit"] as const;

function randomRefId(): string {
  const hex = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
  return `JOB-REF-${hex}`;
}

function randomConfirmationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr, (x) => chars[x % chars.length]).join("");
}

function sumKeys(keys: string[]): number {
  return keys.reduce((s, k) => s + (lookupItemPrice(k) ?? 0), 0);
}

/** Lines for one block of catalog keys (sorted). */
function linesForSelectedKeys(sortedKeys: string[]): string[] {
  const lines: string[] = [];
  if (!sortedKeys.length) {
    lines.push("(No catalog lines — staff to confirm scope.)");
    return lines;
  }
  lines.push("Selected services (indicative ETB pricing):");
  for (const key of sortedKeys) {
    const parsed = parseItemKey(key);
    const price = lookupItemPrice(key);
    if (!parsed || price == null) continue;
    const sectionTitle =
      CATALOG_SECTIONS.find((s) => s.key === parsed.sectionKey)?.title ??
      parsed.sectionKey;
    lines.push(
      `- [${sectionTitle} › ${parsed.category}] ${parsed.name} — ${price.toFixed(2)} ETB`,
    );
  }
  return lines;
}

function buildJobDescription(input: {
  referenceId: string;
  priority: string;
  confirmationCode: string;
  sampleCount: number;
  multiSampleMode: MultiSampleMode;
  sampleNames: string[];
  globalNotes: string;
  perSampleNotes: string[];
  selectionGroups: { label: string; keys: string[] }[];
}): string {
  const lines: string[] = [];
  lines.push(`Client reference ID: ${input.referenceId.trim()}`);
  lines.push(`Requested priority: ${input.priority}`);
  lines.push(`Number of samples: ${input.sampleCount}`);
  lines.push(
    `Per-sample scope: ${
      input.sampleCount >= 2 && input.multiSampleMode === "distinct"
        ? "Different selections / notes per sample"
        : "Same catalog selections for all samples"
    }`,
  );
  lines.push("");
  lines.push("Sample names:");
  for (let i = 0; i < input.sampleCount; i++) {
    const nm = input.sampleNames[i]?.trim() || `Sample ${i + 1}`;
    lines.push(`  ${i + 1}. ${nm}`);
  }
  lines.push("");

  if (
    input.sampleCount === 1 ||
    input.multiSampleMode === "uniform"
  ) {
    const keys = [...(input.selectionGroups[0]?.keys ?? [])].sort();
    lines.push(...linesForSelectedKeys(keys));
    lines.push("");
    if (input.globalNotes.trim()) {
      lines.push("Additional notes (job):");
      lines.push(input.globalNotes.trim());
      lines.push("");
    }
    const one = sumKeys(keys);
    lines.push(
      `Indicative subtotal per sample: ${one.toFixed(2)} ETB × ${input.sampleCount} sample(s) = ${(one * input.sampleCount).toFixed(2)} ETB`,
    );
  } else {
    let grand = 0;
    for (let i = 0; i < input.sampleCount; i++) {
      const keys = [...(input.selectionGroups[i]?.keys ?? [])].sort();
      const nm = input.sampleNames[i]?.trim() || `Sample ${i + 1}`;
      lines.push(`--- Sample ${i + 1}: ${nm} ---`);
      lines.push(...linesForSelectedKeys(keys));
      const note = input.perSampleNotes[i]?.trim();
      if (note) {
        lines.push("Sample-specific notes:");
        lines.push(note);
        lines.push("");
      }
      grand += sumKeys(keys);
    }
    if (input.globalNotes.trim()) {
      lines.push("Additional notes (whole job):");
      lines.push(input.globalNotes.trim());
      lines.push("");
    }
    lines.push(`Indicative total (all samples): ${grand.toFixed(2)} ETB`);
  }

  lines.push(`Confirmation code: ${input.confirmationCode}`);
  lines.push(
    "Note: Listed prices are indicative; final billing follows laboratory confirmation.",
  );
  return lines.join("\n");
}

function buildQrPayload(input: {
  referenceId: string;
  confirmationCode: string;
  selectedKeys: string[];
  sampleCount: number;
  multiSampleMode: MultiSampleMode;
}): string {
  const items = input.selectedKeys
    .map((k) => {
      const parsed = parseItemKey(k);
      const price = lookupItemPrice(k);
      if (!parsed || price == null) return null;
      return {
        c: parsed.category,
        n: parsed.name,
        p: price,
      };
    })
    .filter(Boolean) as { c: string; n: string; p: number }[];

  const total = items.reduce((s, i) => s + i.p, 0);
  const payload = {
    v: 2,
    r: input.referenceId.trim(),
    x: input.confirmationCode,
    nS: input.sampleCount,
    same: input.sampleCount < 2 || input.multiSampleMode === "uniform",
    t: Math.round(total * 100) / 100,
    m: "ETB",
    i: items,
  };
  let out = JSON.stringify(payload);
  if (out.length > 2000) {
    out = JSON.stringify({
      v: 2,
      r: input.referenceId.trim(),
      x: input.confirmationCode,
      nS: input.sampleCount,
      same: input.sampleCount < 2 || input.multiSampleMode === "uniform",
      t: Math.round(total * 100) / 100,
      m: "ETB",
      k: items.length,
    });
  }
  return out;
}

function defaultSampleNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Sample ${i + 1}`);
}

function resizeStringArray(prev: string[], count: number, fill: string): string[] {
  return Array.from({ length: count }, (_, i) =>
    i < prev.length ? prev[i]! : fill,
  );
}

function resizeSets(prev: Set<string>[], count: number): Set<string>[] {
  return Array.from({ length: count }, (_, i) =>
    i < prev.length ? new Set(prev[i]!) : new Set(),
  );
}

export function ClientNewJobRequestForm({ onCreated }: Props) {
  const queryClient = useQueryClient();
  const { data: liveCatalog = [] } = useQuery({
    queryKey: ["client-live-test-catalog"],
    queryFn: fetchActiveTestCatalog,
    staleTime: 120_000,
  });
  const [step, setStep] = useState(0);
  const [referenceId, setReferenceId] = useState("");
  const [sampleCount, setSampleCount] = useState(1);
  const [multiSampleMode, setMultiSampleMode] =
    useState<MultiSampleMode>("uniform");
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const [sampleNames, setSampleNames] = useState<string[]>(() =>
    defaultSampleNames(1),
  );
  const [perSampleNotes, setPerSampleNotes] = useState<string[]>([""]);
  const [perSampleSelections, setPerSampleSelections] = useState<
    Set<string>[]
  >(() => [new Set()]);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [confirmationCode, setConfirmationCode] = useState("");

  const form = useForm<ClientJobRequestValues>({
    defaultValues: {
      description: "",
      priority: "normal",
    },
  });

  const selectedListUniform = useMemo(() => {
    return [...selected]
      .sort()
      .map((k) => {
        const parsed = parseItemKey(k);
        const price = lookupItemPrice(k);
        if (!parsed || price == null) return null;
        return { key: k, ...parsed, price };
      })
      .filter(Boolean) as Array<{
      key: string;
      sectionKey: keyof ClientServiceCatalog;
      category: string;
      name: string;
      price: number;
    }>;
  }, [selected]);

  const selectedListActiveDistinct = useMemo(() => {
    const set = perSampleSelections[activeSampleIndex] ?? new Set<string>();
    return [...set]
      .sort()
      .map((k) => {
        const parsed = parseItemKey(k);
        const price = lookupItemPrice(k);
        if (!parsed || price == null) return null;
        return { key: k, ...parsed, price };
      })
      .filter(Boolean) as Array<{
      key: string;
      sectionKey: keyof ClientServiceCatalog;
      category: string;
      name: string;
      price: number;
    }>;
  }, [perSampleSelections, activeSampleIndex]);

  const subtotalUniform = useMemo(
    () => selectedListUniform.reduce((s, r) => s + r.price, 0),
    [selectedListUniform],
  );

  const indicativeTotal = useMemo(() => {
    if (sampleCount === 1 || multiSampleMode === "uniform") {
      return subtotalUniform * sampleCount;
    }
    return perSampleSelections.reduce(
      (sum, set) => sum + sumKeys([...set]),
      0,
    );
  }, [
    sampleCount,
    multiSampleMode,
    subtotalUniform,
    perSampleSelections,
  ]);

  const catalogSelection =
    sampleCount >= 2 && multiSampleMode === "distinct"
      ? perSampleSelections[activeSampleIndex] ?? new Set()
      : selected;

  const { mutate, isPending } = useMutation({
    mutationFn: createClientJobRequest,
    onSuccess: (job) => {
      toast.success(
        "Request received. Finance will review it; once approved it moves to the laboratory.",
      );
      void queryClient.invalidateQueries({ queryKey: ["client-job-orders"] });
      form.reset({ description: "", priority: "normal" });
      setStep(0);
      setReferenceId("");
      setSampleCount(1);
      setMultiSampleMode("uniform");
      setActiveSampleIndex(0);
      setSampleNames(defaultSampleNames(1));
      setPerSampleNotes([""]);
      setPerSampleSelections([new Set()]);
      setSelected(new Set());
      setConfirmationCode("");
      onCreated?.(job);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const [extraNotes, setExtraNotes] = useState("");
  const priority = form.watch("priority");

  const applySampleCount = (raw: number) => {
    const n = Math.min(MAX_SAMPLES, Math.max(1, Math.floor(raw) || 1));
    setSampleCount(n);
    setSampleNames((prev) => {
      const base = resizeStringArray(prev, n, "");
      return base.map((s, i) =>
        s.trim() ? s : `Sample ${i + 1}`,
      );
    });
    setPerSampleNotes((prev) => resizeStringArray(prev, n, ""));
    setPerSampleSelections((prev) => resizeSets(prev, n));
    setActiveSampleIndex((i) => Math.min(i, n - 1));
    if (n === 1) setMultiSampleMode("uniform");
  };

  const submitRequest = () => {
    const mode: MultiSampleMode =
      sampleCount === 1 ? "uniform" : multiSampleMode;
    const selectionGroups =
      sampleCount === 1 || multiSampleMode === "uniform"
        ? [{ label: "shared", keys: [...selected] }]
        : sampleNames.map((label, i) => ({
            label: label.trim() || `Sample ${i + 1}`,
            keys: [...(perSampleSelections[i] ?? new Set())],
          }));

    const description = buildJobDescription({
      referenceId,
      priority,
      confirmationCode,
      sampleCount,
      multiSampleMode: mode,
      sampleNames,
      globalNotes: extraNotes,
      perSampleNotes,
      selectionGroups,
    });

    const samplesPayload = sampleNames.map((name, i) => ({
      sample_name: name.trim() || `Sample ${i + 1}`,
      notes:
        sampleCount >= 2 && multiSampleMode === "distinct"
          ? (perSampleNotes[i] ?? "").trim()
          : "",
      packaging_type: "",
    }));

    const parsed = clientJobRequestSchema.safeParse({
      description,
      priority,
      samples: samplesPayload,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid request.");
      return;
    }
    mutate(parsed.data);
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
    return extraNotes.trim().length >= 0;
  }, [
    namesOk,
    sampleCount,
    multiSampleMode,
    selected,
    extraNotes,
    perSampleSelections,
    perSampleNotes,
  ]);

  const canProceedStep0 = referenceId.trim().length >= 4;
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

  const goNext = () => {
    if (step === 0 && !canProceedStep0) {
      toast.error("Enter a reference ID (at least 4 characters) or roll one.");
      return;
    }
    if (step === 0) {
      applySampleCount(sampleCount);
    }
    if (step === 1 && !canProceedStep1) {
      if (!namesOk) {
        toast.error("Enter a name or label for every sample.");
        return;
      }
      toast.error(
        sampleCount === 1 || multiSampleMode === "uniform"
          ? "Select at least one service, or add notes (10+ characters) describing your request."
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
        toast.error("Enter a reference ID (at least 4 characters) or roll one.");
        return;
      }
      applySampleCount(sampleCount);
      if (!servicesStepValid) {
        setStep(1);
        toast.error(
          "Complete services on step 2 before review — select services or add notes.",
        );
        return;
      }
      setConfirmationCode((c) => c || randomConfirmationCode());
      setStep(2);
    }
  };

  const toggleItem = (
    sectionKey: keyof ClientServiceCatalog,
    category: string,
    name: string,
  ) => {
    const k = itemKey(sectionKey, category, name);
    if (sampleCount >= 2 && multiSampleMode === "distinct") {
      setPerSampleSelections((prev) =>
        prev.map((s, idx) => {
          if (idx !== activeSampleIndex) return s;
          const n = new Set(s);
          if (n.has(k)) n.delete(k);
          else n.add(k);
          return n;
        }),
      );
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(k)) next.delete(k);
        else next.add(k);
        return next;
      });
    }
  };

  const qrValue = useMemo(() => {
    const selectedKeys =
      sampleCount === 1 || multiSampleMode === "uniform"
        ? [...selected]
        : [...(perSampleSelections[0] ?? new Set())];
    return buildQrPayload({
      referenceId,
      confirmationCode,
      selectedKeys,
      sampleCount,
      multiSampleMode:
        sampleCount === 1 ? "uniform" : multiSampleMode,
    });
  }, [
    referenceId,
    confirmationCode,
    sampleCount,
    multiSampleMode,
    selected,
    perSampleSelections,
  ]);

  const reviewRows =
    sampleCount === 1 || multiSampleMode === "uniform"
      ? selectedListUniform
      : selectedListActiveDistinct;

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6"
      aria-labelledby="new-request-heading"
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FilePlus2 className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="new-request-heading" className="font-semibold tracking-tight">
            New request
          </h2>
          <p className="text-sm text-muted-foreground">
            Multi-step wizard: reference and sample count, service menu, then
            review. Jobs start in finance review; multiple samples can share
            one scope or differ per sample.
          </p>
          {liveCatalog.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Live laboratory catalog: {liveCatalog.length} active tests loaded from the API
              (codes {liveCatalog.slice(0, 3).map((t) => t.test_code).join(", ")}
              {liveCatalog.length > 3 ? "…" : ""}). Menu prices remain indicative until invoiced.
            </p>
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
          <div className="space-y-2">
            <Label htmlFor="client-ref-id">Your job reference ID</Label>
            <p className="text-xs text-muted-foreground">
              Use your own tracking code or tap the round button to create one.
            </p>
            <div className="flex gap-2">
              <Input
                id="client-ref-id"
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
            <Label htmlFor="sample-count">Number of samples</Label>
            <p className="text-xs text-muted-foreground">
              How many separate materials are included in this request? (1–
              {MAX_SAMPLES})
            </p>
            <Input
              id="sample-count"
              type="number"
              min={1}
              max={MAX_SAMPLES}
              className="max-w-[140px] tabular-nums"
              value={sampleCount}
              onChange={(e) => applySampleCount(Number(e.target.value))}
            />
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-6">
          {sampleCount >= 2 ? (
            <div className="space-y-2 rounded-lg border border-border bg-muted/10 p-3">
              <Label className="text-sm">
                Do these samples share the same tests and scope?
              </Label>
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
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Pick services once; they apply to every sample. Label each
                    sample below.
                  </span>
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
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Choose a sample, then pick services and notes for that line
                    only. Repeat for each sample.
                  </span>
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
                    className="gap-1"
                    onClick={() => setActiveSampleIndex(i)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`sample-name-${activeSampleIndex}`}>
                    Sample {activeSampleIndex + 1} name
                  </Label>
                  <Input
                    id={`sample-name-${activeSampleIndex}`}
                    value={sampleNames[activeSampleIndex] ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSampleNames((prev) => {
                        const next = [...prev];
                        next[activeSampleIndex] = v;
                        return next;
                      });
                    }}
                    placeholder={`e.g. Drill core ${activeSampleIndex + 1}`}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor={`sample-notes-${activeSampleIndex}`}>
                    Notes for this sample only (optional)
                  </Label>
                  <Textarea
                    id={`sample-notes-${activeSampleIndex}`}
                    rows={2}
                    placeholder="If you select no catalog lines, these notes must be at least 10 characters."
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
              <p className="text-xs text-muted-foreground">
                All samples share the catalog choices below; names help finance
                and the lab tell them apart.
              </p>
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
                      placeholder={`Sample ${i + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {sampleCount === 1 ? (
            <div className="space-y-2">
              <Label htmlFor="single-sample-name">Sample name</Label>
              <Input
                id="single-sample-name"
                value={sampleNames[0] ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setSampleNames([v]);
                }}
                placeholder="e.g. Channel sample — Line 12"
              />
            </div>
          ) : null}

          <div className="max-h-[min(60vh,520px)] space-y-6 overflow-y-auto rounded-lg border border-border bg-muted/10 p-3 sm:p-4">
            {CATALOG_SECTIONS.map(({ key, title }) => (
              <div key={key}>
                <h3 className="sticky top-0 z-10 border-b border-border bg-card/95 py-2 text-sm font-semibold backdrop-blur">
                  {title}
                </h3>
                <div className="mt-3 space-y-5">
                  {CLIENT_SERVICE_CATALOG[key].map((group) => (
                    <div key={group.category}>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {group.category}
                      </p>
                      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {group.items.map((it) => {
                          const k = itemKey(key, group.category, it.name);
                          const on = catalogSelection.has(k);
                          return (
                            <li key={k}>
                              <label
                                className={cn(
                                  "flex cursor-pointer gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted/50",
                                  on
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-card",
                                )}
                              >
                                <input
                                  type="checkbox"
                                  className="mt-1 size-4 shrink-0 rounded border-input"
                                  checked={on}
                                  onChange={() =>
                                    toggleItem(key, group.category, it.name)
                                  }
                                />
                                <span className="min-w-0 flex-1 leading-snug">
                                  <span className="block">{it.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {it.price.toFixed(2)} ETB
                                  </span>
                                </span>
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="wizard-priority">Priority</Label>
              <select
                id="wizard-priority"
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                )}
                {...form.register("priority")}
              >
                {JOB_PRIORITY_OPTIONS.map(({ value }) => (
                  <option key={value} value={value}>
                    {JOB_PRIORITY_LABEL[value]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="wizard-notes">Additional notes for the whole job (optional)</Label>
              <Textarea
                id="wizard-notes"
                rows={3}
                placeholder="Deadlines, shipping, contacts, or anything that applies to every sample…"
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {sampleCount === 1 || multiSampleMode === "uniform"
                  ? "If you select no services, these notes must be at least 10 characters."
                  : "Per-sample requirements are set above when a sample is selected; use this box for job-wide context."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">
                {catalogSelection.size}
              </span>{" "}
              line(s) in scope
              {sampleCount >= 2 && multiSampleMode === "distinct"
                ? ` (sample ${activeSampleIndex + 1})`
                : null}
            </span>
            <span>
              Indicative total{" "}
              <span className="font-mono font-medium text-foreground">
                {indicativeTotal.toFixed(2)} ETB
              </span>
              {sampleCount > 1 && multiSampleMode === "uniform" ? (
                <span className="text-xs">
                  {" "}
                  ({subtotalUniform.toFixed(2)} × {sampleCount})
                </span>
              ) : null}
            </span>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-start sm:justify-center">
            <div className="rounded-lg bg-white p-3 shadow-sm">
              <RequestSummaryQr value={qrValue} />
            </div>
            <div className="max-w-md space-y-2 text-center sm:text-left">
              <p className="text-sm font-medium">Scan to keep a copy</p>
              <p className="text-xs text-muted-foreground">
                Reference{" "}
                <span className="font-mono text-foreground">{referenceId}</span>
                {" · "}
                Code{" "}
                <span className="font-mono text-foreground">
                  {confirmationCode}
                </span>
                {" · "}
                {sampleCount} sample(s)
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 gap-2"
                onClick={() => {
                  void navigator.clipboard.writeText(qrValue).then(() => {
                    toast.success("QR payload copied to clipboard.");
                  });
                }}
              >
                <Copy className="size-4 shrink-0" aria-hidden />
                Copy summary
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium">Samples</h3>
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border text-sm">
              {sampleNames.map((n, i) => (
                <li key={i} className="px-3 py-2">
                  <span className="tabular-nums text-muted-foreground">
                    {i + 1}.{" "}
                  </span>
                  <span className="font-medium">{n.trim() || `Sample ${i + 1}`}</span>
                  {sampleCount >= 2 && multiSampleMode === "distinct" ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {(perSampleSelections[i]?.size ?? 0)} catalog line(s)
                      {(perSampleNotes[i] ?? "").trim()
                        ? " · has notes"
                        : ""}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium">
              {sampleCount >= 2 && multiSampleMode === "distinct"
                ? `Selected services (sample 1 preview)`
                : "Selected services"}
            </h3>
            {reviewRows.length ? (
              <ul className="mt-2 divide-y divide-border rounded-lg border border-border text-sm">
                {reviewRows.map((row) => (
                  <li
                    key={row.key}
                    className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2"
                  >
                    <span className="min-w-0">
                      <span className="text-muted-foreground">
                        {row.category} ·{" "}
                      </span>
                      {row.name}
                    </span>
                    <span className="font-mono tabular-nums">
                      {row.price.toFixed(2)} ETB
                    </span>
                  </li>
                ))}
                <li className="flex justify-between gap-2 bg-muted/30 px-3 py-2 font-medium">
                  <span>Indicative total (all samples)</span>
                  <span className="font-mono tabular-nums">
                    {indicativeTotal.toFixed(2)} ETB
                  </span>
                </li>
              </ul>
            ) : (
              <p className="mt-2 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
                No catalog lines in this preview — notes carry the scope.
              </p>
            )}
          </div>

          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submitRequest();
            }}
          >
            <Button type="submit" disabled={isPending}>
              {isPending ? "Submitting…" : "Submit request"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                setStep(0);
                setReferenceId("");
                setSampleCount(1);
                setMultiSampleMode("uniform");
                setActiveSampleIndex(0);
                setSampleNames(defaultSampleNames(1));
                setPerSampleNotes([""]);
                setPerSampleSelections([new Set()]);
                setSelected(new Set());
                setExtraNotes("");
                setConfirmationCode("");
                form.reset({ description: "", priority: "normal" });
              }}
            >
              Start over
            </Button>
          </form>
        </div>
      ) : null}
    </section>
  );
}
