import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  useDeleteTestCatalogItem,
  usePatchTestCatalogItem,
} from "@/features/laboratory/hooks";
import type { TestCatalogItem } from "@/types/laboratory";

export function CatalogRow({
  test,
  canWrite,
  hidePricing = false,
  hideDepartmentColumn = false,
  onPatched,
}: {
  test: TestCatalogItem;
  canWrite: boolean;
  hidePricing?: boolean;
  hideDepartmentColumn?: boolean;
  onPatched: () => void;
}) {
  const patchMut = usePatchTestCatalogItem({
    onSuccess: () => {
      toast.success("Catalog updated.");
      onPatched();
    },
  });

  const deleteMut = useDeleteTestCatalogItem({
    onSuccess: () => {
      toast.success("Test deleted.");
      onPatched();
    },
  });

  return (
    <tr className="border-b">
      <td className="px-4 py-2 font-mono text-xs">{test.test_code}</td>
      <td className="px-4 py-2">{test.test_name}</td>
      <td className="px-4 py-2">{test.unit}</td>
      {!hidePricing ? (
        <td className="px-4 py-2 tabular-nums">{test.price}</td>
      ) : null}
      {!hideDepartmentColumn ? (
        <td className="px-4 py-2 text-xs text-muted-foreground">
          {test.department ?? "—"}
        </td>
      ) : null}
      <td className="px-4 py-2">
        {canWrite ? (
          <label className="inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={test.is_active}
              onChange={(e) =>
                patchMut.mutate({ id: test.id, body: { is_active: e.target.checked } })
              }
              disabled={patchMut.isPending}
            />
            Active
          </label>
        ) : test.is_active ? (
          "Yes"
        ) : (
          "No"
        )}
      </td>
      {canWrite ? (
        <td className="px-4 py-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1 text-destructive"
            disabled={deleteMut.isPending}
            onClick={() => {
              if (
                confirm(
                  `Delete test "${test.test_code}"? If it is referenced, deactivate instead.`,
                )
              ) {
                deleteMut.mutate(test.id);
              }
            }}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </td>
      ) : null}
    </tr>
  );
}
