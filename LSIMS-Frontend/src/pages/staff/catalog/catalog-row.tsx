import { useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  deleteTestCatalogItem,
  patchTestCatalogItem,
} from "@/features/laboratory/staff-api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { TestCatalogItem } from "@/types/laboratory";

export function CatalogRow({
  test,
  canWrite,
  onPatched,
}: {
  test: TestCatalogItem;
  canWrite: boolean;
  onPatched: () => void;
}) {
  const patchMut = useMutation({
    mutationFn: (is_active: boolean) =>
      patchTestCatalogItem(test.id, { is_active }),
    onSuccess: () => {
      toast.success("Catalog updated.");
      onPatched();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteTestCatalogItem(test.id),
    onSuccess: () => {
      toast.success("Test deleted.");
      onPatched();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <tr className="border-b">
      <td className="px-4 py-2 font-mono text-xs">{test.test_code}</td>
      <td className="px-4 py-2">{test.test_name}</td>
      <td className="px-4 py-2">{test.unit}</td>
      <td className="px-4 py-2 tabular-nums">{test.price}</td>
      <td className="px-4 py-2 text-xs text-muted-foreground">
        {test.department ?? "—"}
      </td>
      <td className="px-4 py-2">
        {canWrite ? (
          <label className="inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={test.is_active}
              onChange={(e) => patchMut.mutate(e.target.checked)}
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
                deleteMut.mutate();
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
