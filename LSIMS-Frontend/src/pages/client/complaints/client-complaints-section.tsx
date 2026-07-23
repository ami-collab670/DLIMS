import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { fetchComplaints } from "@/features/laboratory/api";
import { useComplaint, useComplaints, useSample, useSamples } from "@/features/laboratory/hooks";
import { useJobOrders } from "@/features/jobs/hooks";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getApiErrorMessage } from "@/lib/api";
import { shortJobId } from "@/lib/laboratory";
import {
  complaintDescriptionPreview,
  formatJobOptionLabel,
  formatSampleDisplayName,
} from "@/lib/laboratory";
import {
  sortRowsClientSide,
  toggleSortState,
  type SortState,
  type TablePageSize,
} from "@/lib/table";
import type { ComplaintCategory, ComplaintStatus, ComplaintRecord } from "@/types/laboratory";

import { ClientComplaintsDetailDrawer } from "./client-complaints-detail-drawer";
import { ClientComplaintsJobFilterBanner } from "./client-complaints-job-filter-banner";
import { ClientComplaintsSampleFilterBanner } from "./client-complaints-sample-filter-banner";
import { ClientComplaintsTable, type ComplaintSortKey } from "./client-complaints-table";
import { ClientComplaintsTableFilters } from "./client-complaints-table-filters";
import { CLIENT_COMPLAINTS_PAGE_SIZE } from "@/lib/laboratory/complaints/constants";

export function ClientComplaintsSection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedComplaintId = searchParams.get("complaint");
  const jobFilter = searchParams.get("job") ?? undefined;
  const sampleFilter = searchParams.get("sample") ?? undefined;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<TablePageSize>(
    CLIENT_COMPLAINTS_PAGE_SIZE,
  );
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<ComplaintCategory | "">("");
  const [sort, setSort] = useState<SortState<ComplaintSortKey>>({
    key: "created_at",
    direction: "desc",
  });

  const handleSort = useCallback((key: ComplaintSortKey) => {
    setSort((prev) => toggleSortState(prev, key));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, categoryFilter, pageSize, jobFilter, sampleFilter]);

  const listParams = useMemo(() => {
    const p: Parameters<typeof fetchComplaints>[0] = {
      page,
      page_size: pageSize,
    };
    if (debouncedSearch) p.search = debouncedSearch;
    if (statusFilter) p.status = statusFilter;
    if (categoryFilter) p.category = categoryFilter;
    if (jobFilter) p.job = jobFilter;
    if (sampleFilter) p.sample = sampleFilter;
    return p;
  }, [page, pageSize, debouncedSearch, statusFilter, categoryFilter, jobFilter, sampleFilter]);

  const { data: jobsData } = useJobOrders(
    {
      page: 1,
      page_size: 50,
      is_cancelled: false,
      ordering: "-updated_at",
    },
    { staleTime: 60_000 },
  );

  const { data: filteredJobSamplesData } = useSamples(
    { job: jobFilter!, page_size: 50 },
    { enabled: Boolean(jobFilter), staleTime: 45_000 },
  );

  const { data: filteredSampleData } = useSample(sampleFilter!, {
    enabled: Boolean(sampleFilter),
    staleTime: 45_000,
  });

  const jobLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const job of jobsData?.results ?? []) {
      map.set(job.id, formatJobOptionLabel(job));
    }
    return map;
  }, [jobsData]);

  const sampleNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const sample of filteredJobSamplesData?.results ?? []) {
      map.set(sample.id, formatSampleDisplayName(sample));
    }
    if (sampleFilter && filteredSampleData) {
      map.set(sampleFilter, formatSampleDisplayName(filteredSampleData));
    }
    return map;
  }, [filteredJobSamplesData, sampleFilter, filteredSampleData]);

  const {
    data: listData,
    isLoading,
    isError,
    error,
    isFetching,
  } = useComplaints(listParams);

  const {
    data: detailComplaint,
    isLoading: detailLoading,
    isError: detailError,
  } = useComplaint(selectedComplaintId!, {
    enabled: Boolean(selectedComplaintId),
  });

  const openComplaint = useCallback(
    (id: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("complaint", id);
        return next;
      });
    },
    [setSearchParams],
  );

  const closeComplaint = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("complaint");
      return next;
    });
  }, [setSearchParams]);

  const setJobFilterParam = useCallback(
    (jobId: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (jobId) {
          next.set("job", jobId);
        } else {
          next.delete("job");
          next.delete("sample");
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const setSampleFilterParam = useCallback(
    (sampleId: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (sampleId) {
          next.set("sample", sampleId);
        } else {
          next.delete("sample");
        }
        return next;
      });
    },
    [setSearchParams],
  );

  const clearJobFilter = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("job");
      return next;
    });
  }, [setSearchParams]);

  const clearSampleFilter = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("sample");
      return next;
    });
  }, [setSearchParams]);

  const sortedComplaints = useMemo(() => {
    const rows = listData?.results ?? [];
    return sortRowsClientSide<ComplaintRecord>(rows, sort, (row, key) => {
      switch (key as ComplaintSortKey) {
        case "category":
          return row.category;
        case "description":
          return complaintDescriptionPreview(row.description);
        case "status":
          return row.status;
        case "job":
          return row.job
            ? (jobLabelById.get(row.job) ?? shortJobId(row.job))
            : "";
        case "sample":
          return row.sample
            ? (sampleNameById.get(row.sample) ?? "Linked sample")
            : "";
        case "created_at":
          return row.created_at;
        default:
          return null;
      }
    });
  }, [listData?.results, sort, jobLabelById, sampleNameById]);

  const filterSamples = filteredJobSamplesData?.results ?? [];
  const jobs = jobsData?.results ?? [];

  const displayComplaint = useMemo(() => {
    if (!selectedComplaintId) return null;
    if (detailComplaint) return detailComplaint;
    return listData?.results.find((c) => c.id === selectedComplaintId) ?? null;
  }, [selectedComplaintId, listData, detailComplaint]);

  return (
    <div className="flex min-h-[min(80vh,720px)] flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        {jobFilter ? (
          <ClientComplaintsJobFilterBanner
            jobFilter={jobFilter}
            jobLabel={jobLabelById.get(jobFilter)}
            onClear={clearJobFilter}
          />
        ) : null}

        {sampleFilter ? (
          <ClientComplaintsSampleFilterBanner
            sampleLabel={sampleNameById.get(sampleFilter) ?? "Linked sample"}
            onClear={clearSampleFilter}
          />
        ) : null}

        <ClientComplaintsTableFilters
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          jobFilter={jobFilter}
          onJobFilterChange={setJobFilterParam}
          sampleFilter={sampleFilter}
          onSampleFilterChange={setSampleFilterParam}
          jobs={jobs}
          filterSamples={filterSamples}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />

        <ClientComplaintsTable
          sortedComplaints={sortedComplaints}
          sort={sort}
          onSort={handleSort}
          selectedComplaintId={selectedComplaintId}
          onOpenComplaint={openComplaint}
          jobLabelById={jobLabelById}
          jobFilter={jobFilter}
          sampleFilter={sampleFilter}
          sampleNameById={sampleNameById}
          isLoading={isLoading}
          isError={isError}
          errorMessage={getApiErrorMessage(error)}
          isEmpty={!listData?.results.length}
          page={page}
          pageSize={pageSize}
          totalCount={listData?.count ?? 0}
          onPageChange={setPage}
          isFetching={isFetching && !isLoading}
        />
      </div>

      {selectedComplaintId ? (
        <ClientComplaintsDetailDrawer
          selectedComplaintId={selectedComplaintId}
          displayComplaint={displayComplaint}
          detailLoading={detailLoading}
          detailError={detailError}
          onClose={closeComplaint}
        />
      ) : null}
    </div>
  );
}
