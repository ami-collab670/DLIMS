import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  pageRangeLabel,
  totalPagesFromCount,
  type TablePageSize,
} from "@/lib/table-list-utils";

type TablePaginationFooterProps = {
  page: number;
  pageSize: TablePageSize;
  count: number;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
  className?: string;
};

export function TablePaginationFooter({
  page,
  pageSize,
  count,
  onPageChange,
  isFetching = false,
  className,
}: TablePaginationFooterProps) {
  if (count <= 0) return null;

  const totalPages = totalPagesFromCount(count, pageSize);

  return (
    <div
      className={
        className ??
        "flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row"
      }
    >
      <p className="text-xs text-muted-foreground">
        {isFetching ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="size-3 animate-spin" />
            Updating…
          </span>
        ) : (
          <>Showing {pageRangeLabel(page, pageSize, count)}</>
        )}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1 || isFetching}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isFetching}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
