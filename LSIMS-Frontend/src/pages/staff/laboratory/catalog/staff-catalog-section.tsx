import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createTestCatalogItem,
  fetchTestCatalog,
} from "@/features/laboratory/staff-api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { TestCatalogItem } from "@/types/laboratory";

import { LABORATORY_PAGE_SIZE } from "../constants";
import { CatalogRow } from "./catalog-row";

export function StaffCatalogSection({ canWrite }: { canWrite: boolean }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["test-catalog", page, debounced],
    queryFn: () =>
      fetchTestCatalog({
        page,
        search: debounced || undefined,
      }),
  });

  const [form, setForm] = useState({
    test_name: "",
    test_code: "",
    unit: "",
    price: "0",
    description: "",
  });

  const createMut = useMutation({
    mutationFn: () =>
      createTestCatalogItem({
        test_name: form.test_name.trim(),
        test_code: form.test_code.trim().toUpperCase(),
        unit: form.unit.trim(),
        price: form.price,
        description: form.description.trim() || undefined,
        is_active: true,
      }),
    onSuccess: () => {
      toast.success("Test added.");
      setForm({ test_name: "", test_code: "", unit: "", price: "0", description: "" });
      queryClient.invalidateQueries({ queryKey: ["test-catalog"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const totalPages = data
    ? Math.max(1, Math.ceil(data.count / LABORATORY_PAGE_SIZE))
    : 1;

  return (
    <div className="space-y-4">
      {!canWrite ? (
        <p className="text-sm text-muted-foreground">
          Test catalog edits require an administrator (or superuser).
        </p>
      ) : (
        <form
          className="grid gap-3 rounded-xl border bg-card p-4 shadow-sm md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.test_name || !form.test_code || !form.unit) {
              toast.error("Name, code, and unit are required.");
              return;
            }
            createMut.mutate();
          }}
        >
          <p className="md:col-span-2 text-sm font-medium">Add catalog entry</p>
          <Input
            placeholder="Test name"
            value={form.test_name}
            onChange={(e) => setForm((f) => ({ ...f, test_name: e.target.value }))}
          />
          <Input
            placeholder="Code e.g. GFA-01"
            value={form.test_code}
            onChange={(e) => setForm((f) => ({ ...f, test_code: e.target.value }))}
          />
          <Input
            placeholder="Unit e.g. ppm"
            value={form.unit}
            onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          />
          <Textarea
            className="md:col-span-2"
            placeholder="Description"
            rows={2}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
          <Button type="submit" disabled={createMut.isPending}>
            Add test
          </Button>
        </form>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Search tests…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="p-4 text-destructive">{getApiErrorMessage(error)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 font-medium">Code</th>
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Unit</th>
                  <th className="px-4 py-2 font-medium">Price</th>
                  <th className="px-4 py-2 font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {data?.results.map((t: TestCatalogItem) => (
                  <CatalogRow
                    key={t.id}
                    test={t}
                    canWrite={canWrite}
                    onPatched={() =>
                      queryClient.invalidateQueries({ queryKey: ["test-catalog"] })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.count > 0 ? (
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <span>
              Page {page}/{totalPages} — {data.count} tests
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
