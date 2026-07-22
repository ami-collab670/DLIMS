import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { TablePaginationFooter } from "@/components/data-table/table-pagination-footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchTestCatalog } from "@/features/laboratory/api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/ui";
import type { TestCatalogItem } from "@/types/laboratory";

const CATALOG_PAGE_SIZE = 25;

export type ReceptionistTestCatalogBrowseProps = {
  variant?: "main" | "panel";
  onSelectTest?: (test: TestCatalogItem) => void;
};

function CatalogTableBody({
  tests,
  onSelectTest,
  compact,
}: {
  tests: TestCatalogItem[];
  onSelectTest?: (test: TestCatalogItem) => void;
  compact?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table
        className={cn(
          "w-full text-left text-sm",
          compact ? "min-w-[320px]" : "min-w-[520px]",
        )}
      >
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Code</th>
            {!compact ? (
              <th className="px-3 py-2 font-medium">Description</th>
            ) : null}
            <th className="px-3 py-2 font-medium">Price</th>
            <th className="px-3 py-2 font-medium">Unit</th>
          </tr>
        </thead>
        <tbody>
          {tests.map((test) => (
            <tr
              key={test.id}
              className={cn(
                "border-b last:border-0",
                onSelectTest &&
                  "cursor-pointer transition-colors hover:bg-muted/50 focus-within:bg-muted/50",
              )}
              onClick={onSelectTest ? () => onSelectTest(test) : undefined}
              onKeyDown={
                onSelectTest
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectTest(test);
                      }
                    }
                  : undefined
              }
              tabIndex={onSelectTest ? 0 : undefined}
              role={onSelectTest ? "button" : undefined}
            >
              <td className="px-3 py-2">{test.test_name}</td>
              <td className="px-3 py-2 font-mono text-xs">{test.test_code}</td>
              {!compact ? (
                <td
                  className="max-w-[200px] truncate px-3 py-2 text-muted-foreground"
                  title={test.description?.trim() || undefined}
                >
                  {test.description?.trim() || "—"}
                </td>
              ) : null}
              <td className="px-3 py-2 tabular-nums">{test.price}</td>
              <td className="px-3 py-2 text-muted-foreground">{test.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CatalogContent({
  variant,
  onSelectTest,
  open,
}: {
  variant: "main" | "panel";
  onSelectTest?: (test: TestCatalogItem) => void;
  open: boolean;
}) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const compact = variant === "panel";

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: [
      "receptionist-test-catalog",
      { search: debouncedSearch, page, pageSize: CATALOG_PAGE_SIZE },
    ],
    queryFn: () =>
      fetchTestCatalog({
        is_active: true,
        search: debouncedSearch || undefined,
        page,
        page_size: CATALOG_PAGE_SIZE,
      }),
    enabled: open,
    staleTime: 120_000,
  });

  return (
    <div className={cn("space-y-3", compact ? "px-0 pb-0 pt-1" : "px-4 pb-4 pt-3")}>
      <p className="text-xs text-muted-foreground">
        Active tests from the laboratory catalog — use when discussing options with
        clients at the desk.
        {onSelectTest ? " Click a row to pre-select a test for assignment." : null}
      </p>

      <div className="space-y-1">
        <Label htmlFor={`receptionist-catalog-search-${variant}`} className="text-xs">
          Search tests
        </Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id={`receptionist-catalog-search-${variant}`}
            className="pl-9"
            placeholder="Name, code, or description…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="py-4 text-sm text-destructive">{getApiErrorMessage(error)}</p>
      ) : !data?.results.length ? (
        <p className="py-4 text-sm text-muted-foreground">
          {debouncedSearch ? "No tests match your search." : "No active tests in the catalog."}
        </p>
      ) : (
        <>
          <CatalogTableBody
            tests={data.results}
            onSelectTest={onSelectTest}
            compact={compact}
          />
          {data.count > 0 ? (
            <TablePaginationFooter
              page={page}
              pageSize={CATALOG_PAGE_SIZE}
              count={data.count}
              onPageChange={setPage}
              isFetching={isFetching && !isLoading}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

export function ReceptionistTestCatalogBrowse({
  variant = "main",
  onSelectTest,
}: ReceptionistTestCatalogBrowseProps) {
  const defaultOpen = variant === "panel";
  const [open, setOpen] = useState(defaultOpen);

  if (variant === "panel") {
    return (
      <section className="space-y-2">
        <div>
          <h4 className="text-sm font-medium">Test catalog</h4>
          <p className="text-xs text-muted-foreground">
            Browse active tests from <code className="rounded bg-muted px-1">/api/laboratory/tests/</code>.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/10 p-3">
          <CatalogContent variant="panel" onSelectTest={onSelectTest} open />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Test catalog
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-border">
          <CatalogContent variant="main" open={open} />
        </div>
      ) : null}
    </section>
  );
}

/** @deprecated Use ReceptionistTestCatalogBrowse — kept for analyst section compatibility. */
export function ReceptionistTestCatalogReference() {
  return <ReceptionistTestCatalogBrowse variant="main" />;
}
