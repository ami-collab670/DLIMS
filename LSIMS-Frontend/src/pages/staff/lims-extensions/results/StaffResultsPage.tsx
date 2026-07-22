import { staffPath } from "@/lib/staff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAnalysisResult,
  fetchAnalysisResults,
  submitAnalysisResult,
} from "@/features/laboratory/api";
import { fetchJobResultSummary } from "@/features/jobs/api";
import { laboratoryQueryKeys } from "@/features/laboratory/query-keys";
import { fetchSampleTests, fetchSamples } from "@/features/laboratory/api";
import { getApiErrorMessage } from "@/lib/api";
import { shortJobId } from "@/lib/laboratory";
import { canManageJobsAndSamples } from "@/lib/staff";
import { useAuthStore } from "@/stores/auth-store";

import { LIMS_EXTENSION_PAGE_SIZE } from "@/lib/staff/lims-extensions/constants";
import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";

export default function StaffResultsPage() {
  const user = useAuthStore((s) => s.user);
  const canPatchSamples = canManageJobsAndSamples(user);
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState("");
  const [lookupJobId, setLookupJobId] = useState("");
  const [draftSampleTest, setDraftSampleTest] = useState("");
  const [draftValue, setDraftValue] = useState("");
  const [draftUnit, setDraftUnit] = useState("");

  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useQuery({
    queryKey: laboratoryQueryKeys.jobResultSummary(lookupJobId),
    queryFn: () => fetchJobResultSummary(lookupJobId),
    enabled: Boolean(lookupJobId),
  });

  const { data: draftResults } = useQuery({
    queryKey: laboratoryQueryKeys.analysisResults({ state: "draft" }),
    queryFn: () => fetchAnalysisResults({ page: 1, state: "draft" }),
    staleTime: 20_000,
  });

  const { data: inPrepSamples } = useQuery({
    queryKey: ["lims-results-samples", "in_analysis"],
    queryFn: () => fetchSamples({ page: 1, sample_status: "in_analysis" }),
    staleTime: 45_000,
  });

  const { data: sampleTestsPage } = useQuery({
    queryKey: ["lims-results-sample-tests"],
    queryFn: () => fetchSampleTests({ page: 1 }),
    staleTime: 45_000,
  });

  const sampleTestOptions = sampleTestsPage?.results ?? [];

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["job-result-summary"] });
    void queryClient.invalidateQueries({ queryKey: ["analysis-results"] });
  };

  const createMut = useMutation({
    mutationFn: () =>
      createAnalysisResult({
        sample_test: draftSampleTest.trim(),
        value: draftValue.trim(),
        unit: draftUnit.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Draft result created.");
      setDraftSampleTest("");
      setDraftValue("");
      setDraftUnit("");
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const submitMut = useMutation({
    mutationFn: submitAnalysisResult,
    onSuccess: () => {
      toast.success("Result submitted for QC.");
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const draftRows = draftResults?.results ?? [];

  return (
    <div className="space-y-8">
      <LimsPageIntro title="Results &amp; analysis tracking">
        <p>
          Look up approved analytical values per job, enter draft results linked to sample-tests, and
          submit them for QC review.
        </p>
      </LimsPageIntro>

      <StaffRoleBanner />

      <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Job result summary</h3>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!jobId.trim()) {
              toast.error("Enter a job ID.");
              return;
            }
            setLookupJobId(jobId.trim());
          }}
        >
          <Input
            className="min-w-[280px] flex-1 font-mono text-sm"
            placeholder="Job UUID"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
          />
          <Button type="submit">Load summary</Button>
        </form>
        {summaryLoading ? (
          <div className="flex py-4">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : summaryError ? (
          <p className="text-sm text-destructive">Could not load result summary.</p>
        ) : summary ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {shortJobId(summary.job)} · {summary.approved}/{summary.total_tests} approved ·{" "}
              {summary.submitted} submitted · {summary.draft} draft
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 font-medium">Test</th>
                    <th className="px-3 py-2 font-medium">Sample</th>
                    <th className="px-3 py-2 font-medium">Value</th>
                    <th className="px-3 py-2 font-medium">State</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.results.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="px-3 py-2 font-mono text-xs">
                        {r.test_code} — {r.test_name}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {r.sample_code ?? r.sample}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {r.value || "—"} {r.unit}
                      </td>
                      <td className="px-3 py-2 capitalize">{r.state}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Enter draft result</h3>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draftSampleTest.trim() || !draftValue.trim()) {
              toast.error("Sample-test ID and value are required.");
              return;
            }
            createMut.mutate();
          }}
        >
          <div className="space-y-1 md:col-span-2">
            <Label>Sample-test assignment</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 font-mono text-sm"
              value={draftSampleTest}
              onChange={(e) => setDraftSampleTest(e.target.value)}
            >
              <option value="">Select sample-test…</option>
              {sampleTestOptions.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.test_code} — {st.test_name} ({st.id.slice(0, 8)}…)
                </option>
              ))}
            </select>
            {sampleTestOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No sample-test assignments found. Link tests to samples in Laboratory first.
              </p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label>Value</Label>
            <Input value={draftValue} onChange={(e) => setDraftValue(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Unit</Label>
            <Input value={draftUnit} onChange={(e) => setDraftUnit(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={createMut.isPending}>
              Save draft
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Draft results</h3>
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 font-medium">Test</th>
                  <th className="px-4 py-2 font-medium">Value</th>
                  <th className="px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {draftRows.slice(0, LIMS_EXTENSION_PAGE_SIZE).map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-4 py-2 font-mono text-xs">
                      {r.test_code} — {r.test_name}
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      {r.value} {r.unit}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            submitMut.mutate(r.id)
                          }
                          disabled={submitMut.isPending}
                        >
                          Submit for QC
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {draftRows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No draft results.</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Samples in analysis</h3>
        <p className="text-xs text-muted-foreground">
          {canPatchSamples ? (
            <>
              Update sample status from the{" "}
              <Link to={staffPath("analyst")} className="text-primary underline-offset-4 hover:underline">
                Analyst
              </Link>{" "}
              workspace.
            </>
          ) : (
            "Read-only pipeline view for your role."
          )}
        </p>
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 font-medium">Sample</th>
                  <th className="px-4 py-2 font-medium">Job</th>
                  <th className="px-4 py-2 font-medium">Tests</th>
                </tr>
              </thead>
              <tbody>
                {inPrepSamples?.results.slice(0, LIMS_EXTENSION_PAGE_SIZE).map((s) => (
                  <tr key={s.id} className="border-b">
                    <td className="px-4 py-2 font-mono text-xs">
                      {s.sample_code ?? s.blind_alias_code}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {s.job ? shortJobId(s.job) : "—"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {s.sample_tests.map((t) => t.test_code).join(", ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
