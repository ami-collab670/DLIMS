import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { patchTestCatalogItem } from "@/features/laboratory/staff-api";
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
  const mut = useMutation({
    mutationFn: (is_active: boolean) =>
      patchTestCatalogItem(test.id, { is_active }),
    onSuccess: () => {
      toast.success("Catalog updated.");
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
      <td className="px-4 py-2">
        {canWrite ? (
          <label className="inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={test.is_active}
              onChange={(e) => mut.mutate(e.target.checked)}
              disabled={mut.isPending}
            />
            Active
          </label>
        ) : test.is_active ? (
          "Yes"
        ) : (
          "No"
        )}
      </td>
    </tr>
  );
}
