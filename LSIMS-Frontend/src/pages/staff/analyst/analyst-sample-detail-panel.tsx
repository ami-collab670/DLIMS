import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useLabAnalysts } from "@/features/accounts/hooks";
import {
  useAnalysisResults,
  useAssignSampleAnalyst,
  useAssignTestToSample,
  useCreateAnalysisResult,
  useCreatePreparationRecord,
  useDeleteSample,
  usePatchAnalysisResult,
  usePatchSample,
  usePreparationRecords,
  useRemoveSampleTestAssignment,
  useSubmitAnalysisResult,
  useTestCatalog,
} from "@/features/laboratory/hooks";
import type { patchSample } from "@/features/laboratory/api";
import {
  useDepartmentAnalystDirectory,
  useDepartmentLabTechDirectory,
} from "@/features/staff/hooks";
import { getApiErrorMessage } from "@/lib/api";
import { isSampleAwaitingPayment } from "@/lib/laboratory";
import { staffSampleDisplayCode } from "@/lib/laboratory";
import { canCreatePreparationRecord } from "@/lib/staff";
import {
  isUserUuid,
  resolveInitialAnalystUserId,
} from "@/lib/staff/qc-manager/analyst-directory";
import { useAuthStore } from "@/stores/auth-store";
import type { AnalysisResult, SampleRecord } from "@/types/laboratory";

import { AnalystSampleAdminEdit } from "./analyst-sample-admin-edit";
import { AnalystSampleAnalystAssign } from "./analyst-sample-analyst-assign";
import { AnalystSampleAssignedTests } from "./analyst-sample-assigned-tests";
import { AnalystSampleCatalogTestAssign } from "./analyst-sample-catalog-test-assign";
import { AnalystSampleMetadataDisplay } from "./analyst-sample-metadata-display";
import { AnalystSamplePanelHeader } from "./analyst-sample-panel-header";
import { AnalystSamplePrepStatusBanner } from "./analyst-sample-prep-status-banner";
import { AnalystSampleResultEntry } from "./analyst-sample-result-entry";
import { AnalystSampleRoutingPanel } from "./analyst-sample-routing-panel";

function formatDateForInput(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) return "";
  return isoOrDate.length >= 10 ? isoOrDate.slice(0, 10) : isoOrDate;
}

function formatDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDisplayDate(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) return "—";
  const d =
    isoOrDate.length >= 10 && !isoOrDate.includes("T")
      ? new Date(`${isoOrDate.slice(0, 10)}T12:00:00`)
      : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return isoOrDate;
  return d.toLocaleDateString();
}

function formatDisplayDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function findEditableResult(
  results: AnalysisResult[],
  sampleTestId: string,
): AnalysisResult | undefined {
  return results.find(
    (r) =>
      r.sample_test === sampleTestId &&
      (r.state === "draft" || r.state === "rejected"),
  );
}

export function AnalystSampleDetailPanel({
  sample,
  canPatchSample,
  canAssignAnalyst,
  hideClientSampleNames,
  showResultEntry = true,
  showSampleRouting = false,
  onClose,
  onUpdated,
}: {
  sample: SampleRecord;
  canPatchSample: boolean;
  canAssignAnalyst: boolean;
  hideClientSampleNames: boolean;
  showResultEntry?: boolean;
  showSampleRouting?: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const departmentId = user?.department ?? null;
  const canCreatePrep = canCreatePreparationRecord(user);

  const displayCode = staffSampleDisplayCode(sample);
  const isBlindView =
    hideClientSampleNames || (!sample.sample_code && Boolean(sample.blind_alias_code));
  const pendingPermanentCode = !sample.sample_code;

  const [sampleName, setSampleName] = useState(sample.sample_name ?? "");
  const [notes, setNotes] = useState(sample.notes);
  const [selectedAnalystId, setSelectedAnalystId] = useState("");
  const [analystSelectionTouched, setAnalystSelectionTouched] = useState(false);
  const [sampleWeight, setSampleWeight] = useState(
    sample.sample_weight != null ? String(sample.sample_weight) : "",
  );
  const [packagingType, setPackagingType] = useState(sample.packaging_type ?? "");
  const [collectionDate, setCollectionDate] = useState(
    formatDateForInput(sample.collection_date),
  );
  const [assignedAt, setAssignedAt] = useState(
    formatDateTimeLocal(sample.assigned_at),
  );
  const [reassignedReason, setReassignedReason] = useState(sample.reassigned_reason ?? "");
  const [testToAdd, setTestToAdd] = useState("");
  const [selectedLabTechId, setSelectedLabTechId] = useState("");
  const [resultSampleTest, setResultSampleTest] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [resultUnit, setResultUnit] = useState("");
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  const { data: sampleResultsPage } = useAnalysisResults(
    { page: 1, page_size: 50, sample: sample.id },
    { enabled: showResultEntry },
  );
  const sampleResults = sampleResultsPage?.results ?? [];

  const { data: prepData, isLoading: prepLoading } = usePreparationRecords(
    { page: 1, sample: sample.id },
    { enabled: showResultEntry || showSampleRouting },
  );

  const prepRecord = prepData?.results[0];

  const { data: labTechDirectory = [], isLoading: labTechDirectoryLoading } =
    useDepartmentLabTechDirectory(departmentId, {
      enabled: showSampleRouting && canCreatePrep,
    });

  const { data: analystDirectory = [], isLoading: analystDirectoryLoading } =
    useDepartmentAnalystDirectory(departmentId, {
      enabled: canAssignAnalyst,
    });

  const { data: labAnalysts = [] } = useLabAnalysts({
    enabled: canAssignAnalyst,
    retry: false,
  });

  const analystOptions = useMemo(() => {
    const map = new Map<string, { id: string; email: string }>();
    for (const a of labAnalysts) {
      map.set(a.id, { id: a.id, email: a.email });
    }
    for (const a of analystDirectory) {
      map.set(a.id, a);
    }
    return [...map.values()].sort((a, b) => a.email.localeCompare(b.email));
  }, [analystDirectory, labAnalysts]);

  const currentAssignedAnalystId = useMemo(
    () => resolveInitialAnalystUserId(sample, analystOptions),
    [sample, analystOptions],
  );

  const analystSelectionChanged =
    Boolean(selectedAnalystId) && selectedAnalystId !== currentAssignedAnalystId;

  const { data: testsPage } = useTestCatalog(
    { page: 1, is_active: true },
    { enabled: canPatchSample },
  );

  useEffect(() => {
    setAnalystSelectionTouched(false);
    setSelectedAnalystId("");
    setSampleName(sample.sample_name ?? "");
    setNotes(sample.notes);
    setSampleWeight(sample.sample_weight != null ? String(sample.sample_weight) : "");
    setPackagingType(sample.packaging_type ?? "");
    setCollectionDate(formatDateForInput(sample.collection_date));
    setAssignedAt(formatDateTimeLocal(sample.assigned_at));
    setReassignedReason(sample.reassigned_reason ?? "");
    setTestToAdd("");
    setSelectedLabTechId("");
    setResultSampleTest(sample.sample_tests[0]?.id ?? "");
    setResultValue("");
    setResultUnit("");
    setActiveDraftId(null);
  }, [sample.id]);

  useEffect(() => {
    if (!resultSampleTest) {
      setActiveDraftId(null);
      setResultValue("");
      setResultUnit("");
      return;
    }
    const existing = findEditableResult(sampleResults, resultSampleTest);
    if (existing) {
      setActiveDraftId(existing.id);
      setResultValue(existing.value ?? "");
      setResultUnit(existing.unit ?? "");
    } else {
      setActiveDraftId(null);
      setResultValue("");
      setResultUnit("");
    }
  }, [resultSampleTest, sampleResults]);

  useEffect(() => {
    if (analystSelectionTouched) return;
    setSelectedAnalystId(resolveInitialAnalystUserId(sample, analystOptions));
  }, [
    sample.id,
    sample.assigned_analyst,
    sample.assigned_analyst_email,
    analystOptions,
    analystSelectionTouched,
  ]);

  const patchMut = usePatchSample({
    onSuccess: () => {
      toast.success("Sample updated.");
      onUpdated();
    },
  });

  const assignAnalystMut = useAssignSampleAnalyst({
    onSuccess: () => {
      toast.success("Analyst assigned.");
      setAnalystSelectionTouched(false);
      onUpdated();
    },
  });

  const createPrepMut = useCreatePreparationRecord({
    onSuccess: () => {
      toast.success("Preparation record created.");
      setSelectedLabTechId("");
      onUpdated();
    },
  });

  const createResultMut = useCreateAnalysisResult();
  const patchResultMut = usePatchAnalysisResult();
  const submitResultMut = useSubmitAnalysisResult();

  const delMut = useDeleteSample({
    onSuccess: () => {
      toast.success("Sample deleted.");
      onUpdated();
      onClose();
    },
  });

  const assignMut = useAssignTestToSample({
    onSuccess: () => {
      toast.success("Test assigned.");
      setTestToAdd("");
      onUpdated();
    },
  });

  const removeTestMut = useRemoveSampleTestAssignment({
    onSuccess: () => {
      toast.success("Assignment removed.");
      onUpdated();
    },
  });

  function buildPatchBody(): Parameters<typeof patchSample>[1] {
    const weightTrim = sampleWeight.trim();
    const body: Parameters<typeof patchSample>[1] = {
      notes,
      packaging_type: packagingType.trim(),
      collection_date: collectionDate.trim() || null,
    };
    if (!hideClientSampleNames) {
      body.sample_name = sampleName.trim() || undefined;
    }
    if (weightTrim) body.sample_weight = weightTrim;
    else body.sample_weight = null;
    if (assignedAt.trim()) {
      const dt = new Date(assignedAt);
      body.assigned_at = Number.isNaN(dt.getTime()) ? null : dt.toISOString();
    } else {
      body.assigned_at = null;
    }
    return body;
  }

  async function handleSaveDraft() {
    try {
      if (activeDraftId) {
        await patchResultMut.mutateAsync({
          id: activeDraftId,
          body: {
            value: resultValue.trim(),
            unit: resultUnit.trim() || undefined,
          },
        });
      } else {
        const result = await createResultMut.mutateAsync({
          sample_test: resultSampleTest,
          value: resultValue.trim(),
          unit: resultUnit.trim() || undefined,
        });
        setActiveDraftId(result.id);
      }
      toast.success("Draft saved.");
      onUpdated();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  async function handleSubmitResult() {
    try {
      let draftId = activeDraftId;
      if (!draftId) {
        const created = await createResultMut.mutateAsync({
          sample_test: resultSampleTest,
          value: resultValue.trim(),
          unit: resultUnit.trim() || undefined,
        });
        draftId = created.id;
        setActiveDraftId(created.id);
      } else if (resultValue.trim()) {
        await patchResultMut.mutateAsync({
          id: draftId,
          body: {
            value: resultValue.trim(),
            unit: resultUnit.trim() || undefined,
          },
        });
      }
      await submitResultMut.mutateAsync(draftId!);
      toast.success("Result submitted for QC.");
      setResultValue("");
      setResultUnit("");
      setActiveDraftId(null);
      onUpdated();
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  }

  const saveDraftPending =
    createResultMut.isPending || patchResultMut.isPending;
  const submitPending =
    createResultMut.isPending ||
    patchResultMut.isPending ||
    submitResultMut.isPending;

  const assignedTestIds = new Set(sample.sample_tests.map((t) => t.test));
  const testsForPicker =
    testsPage?.results.filter((t) => !assignedTestIds.has(t.id)) ?? [];
  const awaitingPayment = isSampleAwaitingPayment(sample);
  const hasAssignedTests = sample.sample_tests.length > 0;
  const showRoutingPanel = showSampleRouting && canAssignAnalyst;

  const isRejectedDraft =
    findEditableResult(sampleResults, resultSampleTest)?.state === "rejected";

  function handleAssignAnalyst() {
    assignAnalystMut.mutate({
      sampleId: sample.id,
      body: {
        assigned_analyst: selectedAnalystId,
        reassigned_reason: reassignedReason.trim() || undefined,
      },
    });
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <AnalystSamplePanelHeader
        displayCode={displayCode}
        isBlindView={isBlindView}
        pendingPermanentCode={pendingPermanentCode}
        onClose={onClose}
      />

      <AnalystSampleMetadataDisplay
        sample={sample}
        isBlindView={isBlindView}
        hideClientSampleNames={hideClientSampleNames}
        canPatchSample={canPatchSample}
        formatDisplayDate={formatDisplayDate}
        formatDisplayDateTime={formatDisplayDateTime}
      />

      <AnalystSampleAssignedTests
        sampleTests={sample.sample_tests}
        canPatchSample={canPatchSample}
        removePending={removeTestMut.isPending}
        onRemoveTest={(sampleTestId, testCode) => {
          if (confirm(`Remove ${testCode} from this sample?`)) {
            removeTestMut.mutate(sampleTestId);
          }
        }}
      />

      {showResultEntry && prepRecord ? (
        <AnalystSamplePrepStatusBanner
          prepRecord={prepRecord}
          formatDisplayDateTime={formatDisplayDateTime}
        />
      ) : null}

      {showResultEntry && sample.sample_tests.length ? (
        <AnalystSampleResultEntry
          sampleTests={sample.sample_tests}
          resultSampleTest={resultSampleTest}
          onResultSampleTestChange={setResultSampleTest}
          resultValue={resultValue}
          onResultValueChange={setResultValue}
          resultUnit={resultUnit}
          onResultUnitChange={setResultUnit}
          activeDraftId={activeDraftId}
          isRejectedDraft={Boolean(isRejectedDraft)}
          saveDraftPending={saveDraftPending}
          submitPending={submitPending}
          onSaveDraft={() => void handleSaveDraft()}
          onSubmitResult={() => void handleSubmitResult()}
        />
      ) : null}

      {canPatchSample ? (
        <AnalystSampleCatalogTestAssign
          testsForPicker={testsForPicker}
          testToAdd={testToAdd}
          onTestToAddChange={setTestToAdd}
          assignPending={assignMut.isPending}
          onAssign={() => assignMut.mutate({ sample: sample.id, test: testToAdd })}
        />
      ) : null}

      {showRoutingPanel ? (
        <AnalystSampleRoutingPanel
          awaitingPayment={awaitingPayment}
          analystDirectoryLoading={analystDirectoryLoading}
          analystOptions={analystOptions}
          selectedAnalystId={selectedAnalystId}
          onSelectedAnalystIdChange={setSelectedAnalystId}
          onAnalystSelectionTouched={() => setAnalystSelectionTouched(true)}
          reassignedReason={reassignedReason}
          onReassignedReasonChange={setReassignedReason}
          analystSelectionChanged={analystSelectionChanged}
          assignAnalystPending={assignAnalystMut.isPending}
          canAssignAnalystUuid={isUserUuid(selectedAnalystId)}
          onAssignAnalyst={handleAssignAnalyst}
          canCreatePrep={canCreatePrep}
          prepLoading={prepLoading}
          prepRecord={prepRecord}
          hasAssignedTests={hasAssignedTests}
          labTechDirectoryLoading={labTechDirectoryLoading}
          labTechDirectory={labTechDirectory}
          selectedLabTechId={selectedLabTechId}
          onSelectedLabTechIdChange={setSelectedLabTechId}
          createPrepPending={createPrepMut.isPending}
          onCreatePrep={() =>
            createPrepMut.mutate({
              sample: sample.id,
              technician: isUserUuid(selectedLabTechId) ? selectedLabTechId : undefined,
            })
          }
        />
      ) : canAssignAnalyst ? (
        <div className="mt-4 space-y-3 border-t pt-4">
          <AnalystSampleAnalystAssign
            awaitingPayment={awaitingPayment}
            analystDirectoryLoading={analystDirectoryLoading}
            analystOptions={analystOptions}
            selectedAnalystId={selectedAnalystId}
            onSelectedAnalystIdChange={setSelectedAnalystId}
            onAnalystSelectionTouched={() => setAnalystSelectionTouched(true)}
            reassignedReason={reassignedReason}
            onReassignedReasonChange={setReassignedReason}
            analystSelectionChanged={analystSelectionChanged}
            assignPending={assignAnalystMut.isPending}
            canAssign={isUserUuid(selectedAnalystId)}
            onAssign={handleAssignAnalyst}
          />
        </div>
      ) : null}

      {canPatchSample ? (
        <AnalystSampleAdminEdit
          isBlindView={isBlindView}
          hideClientSampleNames={hideClientSampleNames}
          sampleName={sampleName}
          onSampleNameChange={setSampleName}
          notes={notes}
          onNotesChange={setNotes}
          patchPending={patchMut.isPending}
          deletePending={delMut.isPending}
          onSave={() => patchMut.mutate({ id: sample.id, body: buildPatchBody() })}
          onDelete={() => {
            if (confirm("Permanently delete this sample?")) delMut.mutate(sample.id);
          }}
        />
      ) : null}
    </div>
  );
}
