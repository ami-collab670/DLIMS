import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { JobOrderSortKey, JobOrderSortState } from "./job-order-list-sort";

type SortableJobTableHeadProps = {
  label: ReactNode;
  sortKey: JobOrderSortKey;
  sort: JobOrderSortState;
  onSort: (key: JobOrderSortKey) => void;
  className?: string;
};

export function SortableJobTableHead({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: SortableJobTableHeadProps) {
  const isActive = sort.key === sortKey;
  const ariaSort = isActive
    ? sort.direction === "asc"
      ? "ascending"
      : "descending"
    : "none";

  const SortIcon = isActive
    ? sort.direction === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <th className={cn("px-4 py-3 font-medium", className)}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 rounded-sm text-left transition-colors",
          "hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
        aria-sort={ariaSort}
        onClick={(e) => {
          e.stopPropagation();
          onSort(sortKey);
        }}
      >
        {label}
        <SortIcon
          className={cn("size-3.5 shrink-0", isActive ? "opacity-100" : "opacity-50")}
          aria-hidden
        />
      </button>
    </th>
  );
}
