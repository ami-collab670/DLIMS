import { AlertCircle, Loader2, Users } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useBreadcrumbSegments } from "@/components/navigation/breadcrumb-segments-context";
import { TableToolbar } from "@/components/data-table/table-toolbar";
import { useLabClients } from "@/features/accounts/hooks";
import { useAllJobOrdersForClientIndex } from "@/features/jobs/hooks";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { getApiErrorMessage } from "@/lib/api";
import { isReceptionist } from "@/lib/staff";
import { cn } from "@/lib/ui";
import type { AdminUserRow } from "@/types/account-admin";
import { useAuthStore } from "@/stores/auth-store";

import {
  hasClientSearchQuery,
  matchesClientSearch,
} from "@/lib/staff/receptionist/client-search";

import { StaffClientDetailPanel } from "./staff-client-detail-panel";
import {
  clientMatchesSearch,
  jobCountByClientEmail,
  jobsForClient,
} from "@/lib/staff/receptionist/client-jobs";

export function StaffClientsDirectorySection() {
  const user = useAuthStore((s) => s.user);
  const searchGated = isReceptionist(user);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedClientEmail = searchParams.get("client")?.trim().toLowerCase() ?? "";

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);

  const clientsQuery = useLabClients({ staleTime: 60_000 });

  const jobsQuery = useAllJobOrdersForClientIndex({ staleTime: 60_000 });

  const jobCounts = useMemo(
    () => jobCountByClientEmail(jobsQuery.data ?? []),
    [jobsQuery.data],
  );

  const filteredClients = useMemo(() => {
    const rows = clientsQuery.data ?? [];
    if (searchGated) {
      if (!hasClientSearchQuery(debouncedSearch)) return [];
      return rows.filter((c) => {
        const contact = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
        return matchesClientSearch(debouncedSearch, {
          organization: c.organization_name,
          name: contact || undefined,
          email: c.email,
          phone: c.phone,
        });
      });
    }
    return rows.filter((c) => clientMatchesSearch(c, debouncedSearch));
  }, [clientsQuery.data, debouncedSearch, searchGated]);

  const showClientTable = !searchGated || hasClientSearchQuery(debouncedSearch);

  const selectedClient = useMemo(() => {
    if (!selectedClientEmail) return null;
    return (
      (clientsQuery.data ?? []).find(
        (c) => c.email.trim().toLowerCase() === selectedClientEmail,
      ) ?? null
    );
  }, [clientsQuery.data, selectedClientEmail]);

  const selectedClientJobs = useMemo(() => {
    if (!selectedClient) return [];
    return jobsForClient(jobsQuery.data ?? [], selectedClient.email);
  }, [jobsQuery.data, selectedClient]);

  const openClient = useCallback(
    (client: AdminUserRow) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("client", client.email);
        return next;
      });
    },
    [setSearchParams],
  );

  const closeClient = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("client");
      return next;
    });
  }, [setSearchParams]);

  const clientDetailSegments = useMemo(() => {
    if (!selectedClient) return [];
    return [
      {
        label: selectedClient.organization_name || selectedClient.email,
        onClick: closeClient,
      },
    ];
  }, [closeClient, selectedClient]);

  useBreadcrumbSegments(clientDetailSegments, "clients-detail");

  const isLoading = clientsQuery.isLoading || jobsQuery.isLoading;
  const isError = clientsQuery.isError || jobsQuery.isError;
  const error = clientsQuery.error ?? jobsQuery.error;

  return (
    <div className="flex min-h-[min(80vh,760px)] flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <TableToolbar
          searchId="staff-clients-search"
          searchPlaceholder={
            searchGated
              ? "Search by client name, phone, or email…"
              : "Search by name, organization, email, or phone…"
          }
          searchValue={searchInput}
          onSearchChange={setSearchInput}
        />

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Loading clients…
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm text-destructive">{getApiErrorMessage(error)}</p>
            </div>
          ) : !showClientTable ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <Users className="size-10 opacity-40" />
              <p className="font-medium text-foreground">Search to view clients</p>
              <p className="max-w-sm text-sm">
                Search by client name, phone, or email to view results.
              </p>
            </div>
          ) : !filteredClients.length ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <Users className="size-10 opacity-40" />
              <p className="font-medium text-foreground">
                {searchGated ? "No clients match your search" : "No clients found"}
              </p>
              {!searchGated ? (
                <p className="max-w-sm text-sm">
                  Active external client accounts appear here for intake and
                  coordination.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 font-medium">Organization</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Jobs</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => {
                    const contact =
                      [client.first_name, client.last_name]
                        .filter(Boolean)
                        .join(" ")
                        .trim() || "—";
                    const count =
                      jobCounts.get(client.email.trim().toLowerCase()) ?? 0;
                    const isSelected =
                      selectedClientEmail === client.email.trim().toLowerCase();

                    return (
                      <tr
                        key={client.id}
                        className={cn(
                          "cursor-pointer border-b border-border transition-colors hover:bg-muted/50",
                          isSelected && "bg-muted/60",
                        )}
                        onClick={() => openClient(client)}
                      >
                        <td className="max-w-[180px] truncate px-4 py-3 font-medium">
                          {client.organization_name?.trim() || "—"}
                        </td>
                        <td className="px-4 py-3">{contact}</td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-xs">
                          {client.email}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {client.phone?.trim() || "—"}
                        </td>
                        <td className="px-4 py-3 tabular-nums">{count}</td>
                        <td className="px-4 py-3 text-xs">
                          {client.is_active ? "Active" : "Inactive"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedClient ? (
        <div className="fixed inset-0 z-50 flex lg:static lg:z-auto lg:w-[420px] lg:shrink-0 lg:self-start">
          <button
            type="button"
            className="flex-1 bg-background/80 backdrop-blur-sm lg:hidden"
            aria-label="Close client details"
            onClick={closeClient}
          />
          <StaffClientDetailPanel
            client={selectedClient}
            clientJobs={selectedClientJobs}
            onClose={closeClient}
          />
        </div>
      ) : null}
    </div>
  );
}
