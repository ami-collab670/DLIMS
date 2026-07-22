import { useQueries } from "@tanstack/react-query";
import { Link2, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { fetchSampleTests } from "@/features/laboratory/api";
import {
  useAssignTestToSample,
  useRemoveSampleTestAssignment,
  useTestCatalog,
} from "@/features/laboratory/hooks";
import type { SampleRecord, SampleTestRow } from "@/types/laboratory";

function sampleLabel(sample: SampleRecord): string {
  return sample.sample_code ?? sample.sample_name ?? sample.id.slice(0, 8);
}

export function ReceptionistJobTestAssignments({
  samples,
  prefillTestId,
  onPrefillTestConsumed,
}: {
  jobId: string;
  samples: SampleRecord[];
  prefillTestId?: string;
  onPrefillTestConsumed?: () => void;
}) {
  const [sampleId, setSampleId] = useState("");
  const [testId, setTestId] = useState("");

  useEffect(() => {
    if (!prefillTestId) return;
    setTestId(prefillTestId);
    onPrefillTestConsumed?.();
  }, [prefillTestId, onPrefillTestConsumed]);

  const sampleIds = useMemo(() => samples.map((s) => s.id), [samples]);
  const sampleById = useMemo(() => {
    const map = new Map<string, SampleRecord>();
    for (const s of samples) map.set(s.id, s);
    return map;
  }, [samples]);

  const { data: testsPage } = useTestCatalog({
    page: 1,
    page_size: 100,
    is_active: true,
  });

  const assignmentQueries = useQueries({
    queries: sampleIds.map((id) => ({
      queryKey: ["sample-tests", { sample: id, page: 1 }],
      queryFn: () => fetchSampleTests({ sample: id, page: 1 }),
      enabled: sampleIds.length > 0,
    })),
  });

  const assignments = assignmentQueries.flatMap(
    (q) => q.data?.results ?? [],
  ) as SampleTestRow[];
  const assignmentsLoading = assignmentQueries.some((q) => q.isLoading);

  const assignMut = useAssignTestToSample({
    onSuccess: () => {
      toast.success("Test assigned.");
      setTestId("");
    },
  });

  const removeMut = useRemoveSampleTestAssignment({
    onSuccess: () => toast.success("Assignment removed."),
  });

  if (!samples.length) {
    return (
      <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
        Register a sample on this job before assigning catalog tests.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <form
        className="grid gap-3 rounded-lg border border-border bg-muted/20 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!sampleId || !testId) {
            toast.error("Choose a sample and a test.");
            return;
          }
          assignMut.mutate({ sample: sampleId, test: testId });
        }}
      >
        <p className="text-sm font-medium">Assign test</p>
        <div className="space-y-1">
          <Label>Sample</Label>
          <select
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={sampleId}
            onChange={(e) => setSampleId(e.target.value)}
          >
            <option value="">Select…</option>
            {samples.map((s) => (
              <option key={s.id} value={s.id}>
                {sampleLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Test</Label>
          <select
            required
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={testId}
            onChange={(e) => setTestId(e.target.value)}
          >
            <option value="">Select…</option>
            {(testsPage?.results ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.test_code} — {t.test_name} ({t.price} {t.unit})
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={assignMut.isPending} className="gap-1">
          <Link2 className="size-4" />
          Assign test
        </Button>
      </form>

      <div className="space-y-2">
        <p className="text-sm font-medium">Test assignments</p>
        {assignmentsLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !assignments.length ? (
          <p className="text-sm text-muted-foreground">No tests assigned on this job yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-3 py-2 font-medium">Test</th>
                  <th className="px-3 py-2 font-medium">Sample</th>
                  <th className="w-20 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {assignments.map((row) => {
                  const sample = sampleById.get(row.sample);
                  return (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs">{row.test_code}</span> {row.test_name}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {sample ? sampleLabel(sample) : row.sample.slice(0, 8)}
                      </td>
                      <td className="px-3 py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          disabled={removeMut.isPending}
                          onClick={() => {
                            if (confirm("Remove this assignment?")) {
                              removeMut.mutate(row.id);
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
