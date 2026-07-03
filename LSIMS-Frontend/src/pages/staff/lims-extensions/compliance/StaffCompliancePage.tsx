import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { TablePaginationFooter } from "@/components/data-table/table-pagination-footer";
import { SortableTableHead } from "@/components/data-table/sortable-table-head";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createComplaint,
  fetchComplaints,
  rejectComplaint,
  resolveComplaint,
} from "@/features/laboratory/complaints-api";
import { laboratoryQueryKeys } from "@/features/laboratory/laboratory-query-keys";
import { getApiErrorMessage } from "@/lib/api-error";
import { shortJobId } from "@/lib/job-order-labels";
import type { ComplaintCategory, ComplaintRecord } from "@/types/laboratory";

import { useClientSideTableList } from "@/hooks/use-client-side-table-list";

import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";

const CATEGORIES: { value: ComplaintCategory; label: string }[] = [
  { value: "payment", label: "Payment" },
  { value: "sample", label: "Sample" },
  { value: "result", label: "Result" },
  { value: "other", label: "Other" },
];

type ComplaintSortKey = "client" | "job" | "category" | "status" | "description";

export default function StaffCompliancePage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<ComplaintRecord | null>(null);
  const [resolution, setResolution] = useState("");
  const [form, setForm] = useState({
    job: "",
    category: "other" as ComplaintCategory,
    description: "",
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: laboratoryQueryKeys.complaints(),
    queryFn: () => fetchComplaints({ page: 1 }),
    staleTime: 30_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["complaints"] });
  };

  const createMut = useMutation({
    mutationFn: () =>
      createComplaint({
        job: form.job.trim() || null,
        category: form.category,
        description: form.description.trim(),
      }),
    onSuccess: () => {
      toast.success("Complaint recorded.");
      setShowCreate(false);
      setForm({ job: "", category: "other", description: "" });
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const resolveMut = useMutation({
    mutationFn: () =>
      resolveComplaint(selected!.id, { resolution: resolution.trim() }),
    onSuccess: () => {
      toast.success("Complaint resolved.");
      setSelected(null);
      setResolution("");
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const rejectMut = useMutation({
    mutationFn: () =>
      rejectComplaint(selected!.id, { resolution: resolution.trim() }),
    onSuccess: () => {
      toast.success("Complaint rejected.");
      setSelected(null);
      setResolution("");
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const rows = data?.results ?? [];

  const table = useClientSideTableList<ComplaintRecord, ComplaintSortKey>({
    rows,
    defaultSort: { key: "status", direction: "asc" },
    getSearchText: (c) =>
      [c.client_email, c.client, c.job, c.category, c.status, c.description]
        .filter(Boolean)
        .join(" "),
    getSortValue: (c, key) => {
      switch (key) {
        case "client":
          return c.client_email ?? c.client ?? "";
        case "job":
          return c.job ?? "";
        case "category":
          return c.category;
        case "status":
          return c.status;
        case "description":
          return c.description;
        default:
          return "";
      }
    },
  });

  return (
    <div className="space-y-8">
      <LimsPageIntro title="Documents &amp; compliance">
        <p>
          Track client complaints, investigations, and resolutions. Operational traceability for
          jobs also uses status notes and role holds elsewhere in LSIMS.
        </p>
      </LimsPageIntro>

      <StaffRoleBanner />

      <div className="flex justify-end">
        <Button type="button" size="sm" variant="outline" onClick={() => setShowCreate((s) => !s)}>
          {showCreate ? "Cancel" : "Log complaint"}
        </Button>
      </div>

      {showCreate ? (
        <form
          className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.description.trim()) {
              toast.error("Description is required.");
              return;
            }
            createMut.mutate();
          }}
        >
          <div className="space-y-1">
            <Label>Job ID (optional)</Label>
            <Input
              className="font-mono text-sm"
              value={form.job}
              onChange={(e) => setForm((f) => ({ ...f, job: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category: e.target.value as ComplaintCategory,
                }))
              }
            >
              {CATEGORIES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={createMut.isPending}>
              Submit complaint
            </Button>
          </div>
        </form>
      ) : null}

      <TableToolbar
        searchPlaceholder="Search complaints…"
        searchValue={table.searchInput}
        onSearchChange={table.setSearchInput}
        pageSize={table.pageSize}
        onPageSizeChange={table.setPageSize}
      />

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <p className="p-4 text-destructive">Could not load complaints.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <SortableTableHead
                    label="Client"
                    sortKey="client"
                    sort={table.sort}
                    onSort={table.handleSort}
                  />
                  <SortableTableHead
                    label="Job"
                    sortKey="job"
                    sort={table.sort}
                    onSort={table.handleSort}
                  />
                  <SortableTableHead
                    label="Category"
                    sortKey="category"
                    sort={table.sort}
                    onSort={table.handleSort}
                  />
                  <SortableTableHead
                    label="Status"
                    sortKey="status"
                    sort={table.sort}
                    onSort={table.handleSort}
                  />
                  <SortableTableHead
                    label="Description"
                    sortKey="description"
                    sort={table.sort}
                    onSort={table.handleSort}
                  />
                  <th className="px-4 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {table.pageRows.map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="px-4 py-2 text-xs">{c.client_email ?? c.client}</td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {c.job ? shortJobId(c.job) : "—"}
                    </td>
                    <td className="px-4 py-2 capitalize">{c.category}</td>
                    <td className="px-4 py-2 capitalize">{c.status.replace(/_/g, " ")}</td>
                    <td className="max-w-[200px] truncate px-4 py-2 text-xs">
                      {c.description}
                    </td>
                    <td className="px-4 py-2">
                      {c.status === "open" || c.status === "in_review" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelected(c);
                            setResolution("");
                          }}
                        >
                          Resolve
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {table.totalCount > 0 ? (
          <TablePaginationFooter
            page={table.page}
            pageSize={table.pageSize}
            count={table.totalCount}
            onPageChange={table.setPage}
          />
        ) : null}
        {!isLoading && rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No complaints logged.</p>
        ) : null}
      </div>

      {selected ? (
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">Resolve complaint</p>
          <div className="space-y-1">
            <Label>Resolution / outcome</Label>
            <Textarea
              rows={3}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={resolveMut.isPending || !resolution.trim()}
              onClick={() => resolveMut.mutate()}
            >
              Mark resolved
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={rejectMut.isPending || !resolution.trim()}
              onClick={() => rejectMut.mutate()}
            >
              Reject
            </Button>
            <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
