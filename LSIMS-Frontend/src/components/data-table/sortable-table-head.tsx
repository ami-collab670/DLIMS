import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";

import type { SortState } from "@/lib/table-list-utils";
import { cn } from "@/lib/utils";

type SortableTableHeadProps<T extends string = string> = {
  label: ReactNode;
  sortKey: T;
  sort: SortState<T>;
  onSort: (key: T) => void;
  className?: string;
};

export function SortableTableHead<T extends string = string>({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: SortableTableHeadProps<T>) {
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
