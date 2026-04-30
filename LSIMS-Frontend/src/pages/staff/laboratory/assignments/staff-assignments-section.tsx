import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  assignTestToSample,
  fetchSampleTests,
  fetchSamples,
  fetchTestCatalog,
  removeSampleTestAssignment,
} from "@/features/laboratory/staff-api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { SampleTestRow } from "@/types/laboratory";

import { LABORATORY_PAGE_SIZE } from "../constants";

export function StaffAssignmentsSection({ manage }: { manage: boolean }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [sampleId, setSampleId] = useState("");
  const [testId, setTestId] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["sample-tests", page],
    queryFn: () => fetchSampleTests({ page }),
  });

  const { data: samplesPage } = useQuery({
    queryKey: ["staff-samples-assign-picker"],
    queryFn: () => fetchSamples({ page: 1 }),
  });

  const { data: testsPage } = useQuery({
    queryKey: ["test-catalog-assign-picker"],
    queryFn: () => fetchTestCatalog({ page: 1, is_active: true }),
  });

  const assignMut = useMutation({
    mutationFn: () => assignTestToSample({ sample: sampleId, test: testId }),
    onSuccess: () => {
      toast.success("Test assigned.");
      setTestId("");
      queryClient.invalidateQueries({ queryKey: ["sample-tests"] });
      queryClient.invalidateQueries({ queryKey: ["staff-samples"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const removeMut = useMutation({
    mutationFn: removeSampleTestAssignment,
    onSuccess: () => {
      toast.success("Assignment removed.");
      queryClient.invalidateQueries({ queryKey: ["sample-tests"] });
      queryClient.invalidateQueries({ queryKey: ["staff-samples"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const totalPages = data
    ? Math.max(1, Math.ceil(data.count / LABORATORY_PAGE_SIZE))
    : 1;

  return (
    <div className="space-y-4">
      {!manage ? (
        <p className="text-sm text-muted-foreground">
          Read-only: only administrators and receptionists can assign tests.
        </p>
      ) : (
        <form
          className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!sampleId || !testId) {
              toast.error("Choose a sample and a test.");
              return;
            }
            assignMut.mutate();
          }}
        >
          <div className="space-y-1">
            <Label>Sample</Label>
            <select
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={sampleId}
              onChange={(e) => setSampleId(e.target.value)}
            >
              <option value="">Select…</option>
              {samplesPage?.results.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sample_code ?? s.blind_alias_code} —{" "}
                  {s.sample_name?.trim() ? s.sample_name : s.blind_alias_code}
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
              {testsPage?.results.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.test_code} — {t.test_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={assignMut.isPending} className="gap-1">
              <Link2 className="size-4" />
              Assign
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="p-4 text-destructive">{getApiErrorMessage(error)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 font-medium">Test</th>
                  <th className="px-4 py-2 font-medium">Sample ID</th>
                  <th className="w-24 px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {data?.results.map((row: SampleTestRow) => (
                  <tr key={row.id} className="border-b">
                    <td className="px-4 py-2">
                      <span className="font-mono text-xs">{row.test_code}</span>{" "}
                      {row.test_name}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {row.sample.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-2">
                      {manage ? (
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
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.count > 0 ? (
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <span>
              {(page - 1) * LABORATORY_PAGE_SIZE + 1}–
              {Math.min(page * LABORATORY_PAGE_SIZE, data.count)} / {data.count}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
