import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";

import { useSamples } from "@/features/laboratory/hooks";
import { getApiErrorMessage } from "@/lib/api";
import {
  staffSampleDisplayCode,
  staffSampleRowLabel,
} from "@/lib/laboratory";
import { RegisterSampleForm } from "@/pages/staff/analyst/register-sample-form";
import { StaffJobDetailPanel } from "@/pages/staff/laboratory/jobs/staff-job-detail-panel";
import { ReceptionistTestCatalogBrowse } from "@/pages/staff/receptionist/shared/receptionist-test-catalog-reference";
import type { JobOrder } from "@/types/laboratory";

import { ReceptionistJobTestAssignments } from "./receptionist-job-test-assignments";

export function ReceptionistJobDetailPanel({
  job,
  onClose,
  manageJobs,
  onUpdated,
}: {
  job: JobOrder;
  onClose: () => void;
  manageJobs: boolean;
  onUpdated: () => void;
}) {
  const [prefillTestId, setPrefillTestId] = useState<string | undefined>();
  const clearPrefillTest = useCallback(() => setPrefillTestId(undefined), []);

  const samplesParams = { job: job.id, page: 1, page_size: 50 };

  const {
    data: samplesData,
    isLoading: samplesLoading,
    isError: samplesError,
    error: samplesErr,
  } = useSamples(samplesParams, { staleTime: 15_000 });

  const samples = samplesData?.results ?? [];

  const invalidateJobSamples = () => {
    onUpdated();
  };

  return (
    <div className="flex flex-col">
      <StaffJobDetailPanel
        job={job}
        onClose={onClose}
        manageJobs={manageJobs}
        financeReadOnly
        onUpdated={onUpdated}
      />

      <div className="space-y-6 border-t border-border p-4">
        <ReceptionistTestCatalogBrowse
          variant="panel"
          onSelectTest={(test) => setPrefillTestId(test.id)}
        />

        <RegisterSampleForm
          fixedJobId={job.id}
          fixedJob={job}
          showIntakeChecklist
          onCreated={invalidateJobSamples}
        />

        <section className="space-y-2">
          <h4 className="text-sm font-medium">Samples on this job</h4>
          {samplesLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : samplesError ? (
            <p className="text-sm text-destructive">{getApiErrorMessage(samplesErr)}</p>
          ) : !samples.length ? (
            <p className="text-sm text-muted-foreground">No samples registered yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[320px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2 font-medium">Code</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Analyst</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {samples.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="px-3 py-2 font-mono text-xs">
                        {staffSampleDisplayCode(s)}
                      </td>
                      <td className="max-w-[140px] truncate px-3 py-2">
                        {staffSampleRowLabel(s, false)}
                      </td>
                      <td className="max-w-[120px] truncate px-3 py-2 text-muted-foreground">
                        {s.assigned_analyst ?? "—"}
                      </td>
                      <td className="px-3 py-2 capitalize">
                        {s.sample_status.replace(/_/g, " ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h4 className="text-sm font-medium">Test assignments</h4>
          <ReceptionistJobTestAssignments
            jobId={job.id}
            samples={samples}
            prefillTestId={prefillTestId}
            onPrefillTestConsumed={clearPrefillTest}
          />
        </section>
      </div>
    </div>
  );
}
