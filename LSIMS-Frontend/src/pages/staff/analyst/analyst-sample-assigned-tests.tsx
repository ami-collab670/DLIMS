import { Button } from "@/components/ui/button";
import type { SampleRecord } from "@/types/laboratory";

type AnalystSampleAssignedTestsProps = {
  sampleTests: SampleRecord["sample_tests"];
  canPatchSample: boolean;
  removePending: boolean;
  onRemoveTest: (sampleTestId: string, testCode: string) => void;
};

export function AnalystSampleAssignedTests({
  sampleTests,
  canPatchSample,
  removePending,
  onRemoveTest,
}: AnalystSampleAssignedTestsProps) {
  return (
    <div className="mt-3 text-sm">
      <span className="text-muted-foreground">Assigned tests: </span>
      {sampleTests.length ? (
        <ul className="mt-1 list-inside list-disc text-sm">
          {sampleTests.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs">
                {t.test_code} — {t.test_name}
              </span>
              {canPatchSample ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-destructive"
                  disabled={removePending}
                  onClick={() => onRemoveTest(t.id, t.test_code)}
                >
                  Remove
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        "—"
      )}
    </div>
  );
}
