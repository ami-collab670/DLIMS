import { ChevronDown, Loader2, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

import {
  filterClientCatalog,
  GENERAL_SERVICES_LABEL,
  getDepartmentFilterOptions,
  lookupTestPrice,
  OTHER_SERVICES_LABEL,
  type ClientCatalogGroup,
  type ClientCatalogIndex,
  type DepartmentFilter,
} from "./service-catalog";

type Props = {
  groups: ClientCatalogGroup[];
  index: ClientCatalogIndex;
  selectedIds: Set<string>;
  onToggle: (testId: string) => void;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  selectionHint?: string;
  indicativeTotal?: number;
};

function CatalogSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 2 }).map((_, gi) => (
        <div key={gi} className="space-y-3">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, ci) => (
              <div
                key={ci}
                className="h-24 animate-pulse rounded-lg border border-border bg-muted/40"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TestCard({
  test,
  selected,
  onToggle,
}: {
  test: ClientCatalogGroup["tests"][number];
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-3 rounded-lg border px-3 py-3 text-sm transition-colors hover:bg-muted/50",
        selected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card",
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
        checked={selected}
        onChange={onToggle}
      />
      <span className="min-w-0 flex-1 leading-snug">
        <span className="mb-1 inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {test.test_code}
        </span>
        <span className="mt-1 block font-medium">{test.test_name}</span>
        {test.description ? (
          <span
            className="mt-0.5 block truncate text-xs text-muted-foreground"
            title={test.description}
          >
            {test.description}
          </span>
        ) : null}
        <span className="mt-1.5 block text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">
            {formatMoney(test.priceNumber)}
          </span>
          {test.unit ? (
            <>
              {" "}
              · <span>{test.unit}</span>
            </>
          ) : null}
        </span>
      </span>
    </label>
  );
}

function departmentDisplayName(group: ClientCatalogGroup): string {
  if (group.departmentId == null) return OTHER_SERVICES_LABEL;
  if (group.departmentName === GENERAL_SERVICES_LABEL) return OTHER_SERVICES_LABEL;
  return group.departmentName;
}

function DepartmentSection({
  group,
  selectedIds,
  onToggle,
}: {
  group: ClientCatalogGroup;
  selectedIds: Set<string>;
  onToggle: (testId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const selectedInGroup = group.tests.filter((t) => selectedIds.has(t.id)).length;
  const displayName = departmentDisplayName(group);

  return (
    <section className="border-b border-border last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-1 py-3 text-left transition-colors hover:bg-muted/30"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <span className="flex min-w-0 items-center gap-2">
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              expanded ? "rotate-0" : "-rotate-90",
            )}
            aria-hidden
          />
          <span className="truncate text-sm font-semibold">{displayName}</span>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
            {group.tests.length}
          </span>
        </span>
        {selectedInGroup > 0 ? (
          <span className="shrink-0 text-xs text-primary">
            {selectedInGroup} selected
          </span>
        ) : null}
      </button>
      {expanded ? (
        group.tests.length === 0 ? (
          <p className="pb-4 text-sm text-muted-foreground">
            No tests are listed in this department yet.
          </p>
        ) : (
          <ul className="grid gap-2 pb-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.tests.map((test) => (
              <li key={test.id}>
                <TestCard
                  test={test}
                  selected={selectedIds.has(test.id)}
                  onToggle={() => onToggle(test.id)}
                />
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}

export function ClientServiceCatalogPicker({
  groups,
  index,
  selectedIds,
  onToggle,
  isLoading,
  error,
  onRetry,
  selectionHint,
  indicativeTotal,
}: Props) {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>("all");

  const filterOptions = useMemo(
    () => getDepartmentFilterOptions(groups),
    [groups],
  );

  const filteredGroups = useMemo(
    () => filterClientCatalog(groups, search, departmentFilter),
    [groups, search, departmentFilter],
  );

  const selectedCount = selectedIds.size;
  const selectedTotal = useMemo(
    () =>
      [...selectedIds].reduce(
        (sum, id) => sum + lookupTestPrice(id, index),
        0,
      ),
    [selectedIds, index],
  );

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4">
        <div className="relative">
          <Label htmlFor="catalog-search" className="sr-only">
            Search tests
          </Label>
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="catalog-search"
            className="pl-9"
            placeholder="Search by name, code, unit, or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isLoading}
          />
        </div>
        {filterOptions.length > 1 ? (
          <div
            className="mt-3 flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filter by department"
          >
            {filterOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  departmentFilter === opt.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50",
                )}
                onClick={() => setDepartmentFilter(opt.id)}
                disabled={isLoading}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-muted/10 shadow-sm">
        {isLoading ? (
          <CatalogSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm text-destructive">{getApiErrorMessage(error)}</p>
            {onRetry ? (
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="mr-2 size-4" aria-hidden />
                Retry
              </Button>
            ) : null}
          </div>
        ) : groups.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No active tests are available in the catalog yet. Add notes below to
            describe your request, or contact the laboratory.
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No tests match your search
            {departmentFilter !== "all" ? " in this department" : ""}. Try a
            different term or clear filters.
          </div>
        ) : (
          <div className="max-h-[min(60vh,520px)] overflow-y-auto px-3 sm:px-4">
            {filteredGroups.map((group) => (
              <DepartmentSection
                key={group.departmentId ?? "general"}
                group={group}
                selectedIds={selectedIds}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card/95 px-3 py-2.5 text-sm shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground tabular-nums">
            {selectedCount}
          </span>{" "}
          test{selectedCount === 1 ? "" : "s"} selected
          {selectionHint ? (
            <span className="text-xs"> · {selectionHint}</span>
          ) : null}
        </span>
        <span className="font-mono font-medium tabular-nums text-foreground">
          {formatMoney(
            typeof indicativeTotal === "number" ? indicativeTotal : selectedTotal,
          )}{" "}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            indicative
          </span>
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Loading laboratory catalog…
        </div>
      ) : null}
    </div>
  );
}
