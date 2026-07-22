import { Search } from "lucide-react";

import { TableColumnFilterSelect } from "@/components/data-table/table-column-filter-select";
import { TablePageSizeSelect } from "@/components/data-table/table-toolbar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type TablePageSize } from "@/lib/table";
import { cn } from "@/lib/ui";
import type { ComplaintCategory, ComplaintStatus, JobOrder, SampleRecord } from "@/types/laboratory";

import { formatSampleDisplayName } from "@/lib/laboratory";
import { ClientJobRequestSelect } from "./client-job-request-select";
import { COMPLAINT_CATEGORY_OPTIONS, COMPLAINT_STATUS_OPTIONS } from "@/lib/laboratory/complaints/constants";

type ClientComplaintsTableFiltersProps = {
  categoryFilter: ComplaintCategory | "";
  onCategoryFilterChange: (value: ComplaintCategory | "") => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  statusFilter: ComplaintStatus | "";
  onStatusFilterChange: (value: ComplaintStatus | "") => void;
  jobFilter?: string;
  onJobFilterChange: (jobId: string) => void;
  sampleFilter?: string;
  onSampleFilterChange: (sampleId: string) => void;
  jobs: JobOrder[];
  filterSamples: SampleRecord[];
  pageSize: TablePageSize;
  onPageSizeChange: (size: TablePageSize) => void;
  className?: string;
};

const filterFieldClassName = "min-w-[9rem] shrink-0 space-y-1.5";

export function ClientComplaintsTableFilters({
  categoryFilter,
  onCategoryFilterChange,
  searchInput,
  onSearchInputChange,
  statusFilter,
  onStatusFilterChange,
  jobFilter,
  onJobFilterChange,
  sampleFilter,
  onSampleFilterChange,
  jobs,
  filterSamples,
  pageSize,
  onPageSizeChange,
  className,
}: ClientComplaintsTableFiltersProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3 lg:flex-nowrap">
          <div className={filterFieldClassName}>
            <Label htmlFor="filter-complaint-category" className="text-xs">
              Category
            </Label>
            <TableColumnFilterSelect
              id="filter-complaint-category"
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(value) => onCategoryFilterChange(value as ComplaintCategory | "")}
              className="h-9 text-sm"
            >
              <option value="">All categories</option>
              {COMPLAINT_CATEGORY_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </TableColumnFilterSelect>
          </div>

          <div className={filterFieldClassName}>
            <Label htmlFor="filter-complaint-status" className="text-xs">
              Status
            </Label>
            <TableColumnFilterSelect
              id="filter-complaint-status"
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(value) => onStatusFilterChange(value as ComplaintStatus | "")}
              className="h-9 text-sm"
            >
              <option value="">All statuses</option>
              {COMPLAINT_STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </TableColumnFilterSelect>
          </div>

          <div className={cn(filterFieldClassName, "min-w-[11rem] flex-1")}>
            <Label htmlFor="filter-complaint-request" className="text-xs">
              Request
            </Label>
            <ClientJobRequestSelect
              id="filter-complaint-request"
              aria-label="Filter by request"
              value={jobFilter ?? ""}
              onChange={onJobFilterChange}
              jobs={jobs}
              showValidationToast={false}
              placeholder="All requests…"
              className="w-full"
            />
          </div>

          <div className={filterFieldClassName}>
            <Label htmlFor="filter-complaint-sample" className="text-xs">
              Sample
            </Label>
            {jobFilter ? (
              <TableColumnFilterSelect
                id="filter-complaint-sample"
                aria-label="Filter by sample"
                value={sampleFilter ?? ""}
                onChange={onSampleFilterChange}
                className="h-9 text-sm"
              >
                <option value="">All samples</option>
                {filterSamples.map((sample) => (
                  <option key={sample.id} value={sample.id}>
                    {formatSampleDisplayName(sample)}
                  </option>
                ))}
              </TableColumnFilterSelect>
            ) : (
              <select
                id="filter-complaint-sample"
                disabled
                aria-label="Filter by sample"
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-muted/40 px-3 text-sm shadow-sm",
                  "cursor-not-allowed opacity-60",
                )}
                value=""
              >
                <option value="">Select request first</option>
              </select>
            )}
          </div>

          <TablePageSizeSelect
            id="complaints-page-size"
            value={pageSize}
            onChange={onPageSizeChange}
            className="ml-auto shrink-0"
          />
        </div>

        <div className="w-full space-y-1.5">
          <Label htmlFor="filter-complaint-description" className="text-xs">
            Description
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="filter-complaint-description"
              aria-label="Filter by description"
              value={searchInput}
              onChange={(event) => onSearchInputChange(event.target.value)}
              placeholder="Search descriptions…"
              className="h-9 w-full pl-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
