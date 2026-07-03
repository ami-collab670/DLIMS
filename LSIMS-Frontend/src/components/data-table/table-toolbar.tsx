import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TABLE_PAGE_SIZE_OPTIONS,
  type TablePageSize,
} from "@/lib/table-list-utils";
import { cn } from "@/lib/utils";

type TableToolbarProps = {
  searchId?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  pageSize?: TablePageSize;
  onPageSizeChange?: (size: TablePageSize) => void;
  showPageSize?: boolean;
  children?: ReactNode;
  className?: string;
};

export function TablePageSizeSelect({
  id = "table-page-size",
  value,
  onChange,
  className,
}: {
  id?: string;
  value: TablePageSize;
  onChange: (size: TablePageSize) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id} className="text-xs">
        Rows per page
      </Label>
      <select
        id={id}
        className={cn(
          "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        )}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as TablePageSize)}
      >
        {TABLE_PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TableToolbar({
  searchId = "table-search",
  searchPlaceholder = "Search…",
  searchValue,
  onSearchChange,
  pageSize,
  onPageSizeChange,
  showPageSize = true,
  children,
  className,
}: TableToolbarProps) {
  const hasSearch = onSearchChange != null;
  const hasPageSize =
    showPageSize && pageSize != null && onPageSizeChange != null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end",
        className,
      )}
    >
      {hasSearch ? (
        <div className="relative min-w-[200px] flex-1">
          <Label htmlFor={searchId} className="sr-only">
            Search
          </Label>
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id={searchId}
            className="pl-9"
            placeholder={searchPlaceholder}
            value={searchValue ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      ) : null}
      {children}
      {hasPageSize ? (
        <TablePageSizeSelect
          value={pageSize}
          onChange={onPageSizeChange}
          className="w-full sm:w-auto"
        />
      ) : null}
    </div>
  );
}
