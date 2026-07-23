import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { TestCatalogItem } from "@/types/laboratory";

type AnalystSampleCatalogTestAssignProps = {
  testsForPicker: TestCatalogItem[];
  testToAdd: string;
  onTestToAddChange: (value: string) => void;
  assignPending: boolean;
  onAssign: () => void;
};

export function AnalystSampleCatalogTestAssign({
  testsForPicker,
  testToAdd,
  onTestToAddChange,
  assignPending,
  onAssign,
}: AnalystSampleCatalogTestAssignProps) {
  if (!testsForPicker.length) return null;

  return (
    <div className="mt-4 space-y-2 border-t pt-4">
      <Label>Assign catalog test</Label>
      <div className="flex flex-wrap gap-2">
        <select
          className="flex min-w-[200px] flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          value={testToAdd}
          onChange={(e) => onTestToAddChange(e.target.value)}
        >
          <option value="">Select test…</option>
          {testsForPicker.map((t) => (
            <option key={t.id} value={t.id}>
              {t.test_code} — {t.test_name}
            </option>
          ))}
        </select>
        <Button type="button" disabled={!testToAdd || assignPending} onClick={onAssign}>
          Assign test
        </Button>
      </div>
    </div>
  );
}
