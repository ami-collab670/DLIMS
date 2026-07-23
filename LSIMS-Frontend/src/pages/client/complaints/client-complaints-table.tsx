import { AlertCircle, Calendar, Loader2, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

import { TablePaginationFooter } from "@/components/data-table/table-pagination-footer";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { shortJobId } from "@/lib/laboratory";
import { complaintDescriptionPreview } from "@/lib/laboratory";
import { cn } from "@/lib/ui";
import type { SortState, TablePageSize } from "@/lib/table";
import type { ComplaintRecord } from "@/types/laboratory";

import {
  ClientComplaintCategoryBadge,
  ClientComplaintStatusBadge,
} from "./client-complaint-badges";

export type ComplaintSortKey =
  | "category"
  | "description"
  | "status"
  | "job"
  | "sample"
  | "created_at";

type ClientComplaintsTableProps = {
  sortedComplaints: ComplaintRecord[];
  sort: SortState<ComplaintSortKey>;
  onSort: (key: ComplaintSortKey) => void;
  selectedComplaintId: string | null;
  onOpenComplaint: (id: string) => void;
  jobLabelById: Map<string, string>;
  jobFilter: string | undefined;
  sampleFilter: string | undefined;
  sampleNameById: Map<string, string>;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  isEmpty: boolean;
  page: number;
  pageSize: TablePageSize;
  totalCount: number;
  onPageChange: (page: number) => void;
  isFetching: boolean;
};

function renderSampleCell(
  complaintSample: string | null,
  sampleFilter: string | undefined,
  jobFilter: string | undefined,
  sampleNameById: Map<string, string>,
): string {
  if (!complaintSample) return "—";
  if (sampleFilter && sampleNameById.has(complaintSample)) {
    return sampleNameById.get(complaintSample)!;
  }
  if (jobFilter && sampleNameById.has(complaintSample)) {
    return sampleNameById.get(complaintSample)!;
  }
  return "Linked sample";
}

export function ClientComplaintsTable({
  sortedComplaints,
  sort,
  onSort,
  selectedComplaintId,
  onOpenComplaint,
  jobLabelById,
  jobFilter,
  sampleFilter,
  sampleNameById,
  isLoading,
  isError,
  errorMessage,
  isEmpty,
  page,
  pageSize,
  totalCount,
  onPageChange,
  isFetching,
}: ClientComplaintsTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading complaints…
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-sm text-destructive">{errorMessage}</p>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <MessageSquare className="size-10 opacity-40" />
          <p className="font-medium text-foreground">No complaints submitted yet</p>
          <p className="max-w-sm text-sm">
            Use the form above to submit a complaint. Laboratory staff will review and
            respond here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <SortableTableHead
                  label="Category"
                  sortKey="category"
                  sort={sort}
                  onSort={onSort}
                  className="py-3"
                />
                <SortableTableHead
                  label="Description"
                  sortKey="description"
                  sort={sort}
                  onSort={onSort}
                  className="py-3"
                />
                <SortableTableHead
                  label="Status"
                  sortKey="status"
                  sort={sort}
                  onSort={onSort}
                  className="py-3"
                />
                <SortableTableHead
                  label="Request"
                  sortKey="job"
                  sort={sort}
                  onSort={onSort}
                  className="py-3"
                />
                <SortableTableHead
                  label="Sample"
                  sortKey="sample"
                  sort={sort}
                  onSort={onSort}
                  className="py-3"
                />
                <SortableTableHead
                  label={
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3.5 opacity-70" aria-hidden />
                      Submitted
                    </span>
                  }
                  sortKey="created_at"
                  sort={sort}
                  onSort={onSort}
                  className="py-3"
                />
              </tr>
            </thead>
            <tbody>
              {sortedComplaints.map((complaint) => (
                <tr
                  key={complaint.id}
                  className={cn(
                    "cursor-pointer border-b border-border transition-colors hover:bg-muted/50",
                    selectedComplaintId === complaint.id && "bg-muted/60",
                  )}
                  onClick={() => onOpenComplaint(complaint.id)}
                >
                  <td className="px-4 py-3">
                    <ClientComplaintCategoryBadge category={complaint.category} />
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">
                    {complaintDescriptionPreview(complaint.description) || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <ClientComplaintStatusBadge status={complaint.status} />
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3">
                    {complaint.job ? (
                      <Link
                        to={`/client/requests?job=${complaint.job}`}
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {jobLabelById.get(complaint.job) ?? shortJobId(complaint.job)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-[140px] truncate px-4 py-3 text-muted-foreground">
                    {renderSampleCell(
                      complaint.sample,
                      sampleFilter,
                      jobFilter,
                      sampleNameById,
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {new Date(complaint.created_at).toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalCount > 0 ? (
        <TablePaginationFooter
          page={page}
          pageSize={pageSize}
          count={totalCount}
          onPageChange={onPageChange}
          isFetching={isFetching}
        />
      ) : null}
    </div>
  );
}
