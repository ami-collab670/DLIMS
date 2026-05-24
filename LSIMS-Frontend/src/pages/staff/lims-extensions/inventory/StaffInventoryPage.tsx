import { useQuery } from "@tanstack/react-query";

import { fetchTestCatalog } from "@/features/laboratory/staff-api";
import { canManageTestCatalog } from "@/lib/staff-permissions";
import { useAuthStore } from "@/stores/auth-store";

import { LIMS_EXTENSION_PAGE_SIZE } from "../constants";
import { LimsPageIntro } from "../lims-page-intro";
import { StaffRoleBanner } from "../staff-role-banner";

/**
 * Backend: no consumables/inventory model — TestCatalog is the closest "master data" list
 * with unit, price, and active flag (authenticated read).
 */
export default function StaffInventoryPage() {
  const user = useAuthStore((s) => s.user);
  const catalogAdmin = canManageTestCatalog(user);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["lims-inventory-catalog"],
    queryFn: () => fetchTestCatalog({ page: 1, is_active: true }),
    staleTime: 120_000,
  });

  return (
    <div className="space-y-8">
      <LimsPageIntro title="Inventory &amp; standards (catalog view)">
        <p>
          There is no reagent lot, CRM, or standard reference API in this version. The active{" "}
          <strong>test catalog</strong> doubles as the register of billable/analytical services
          and their units (
          <code className="rounded bg-muted px-1">GET /api/laboratory/tests/?is_active=true</code>
          ).
        </p>
      </LimsPageIntro>

      <StaffRoleBanner />

      {!catalogAdmin ? (
        <div className="rounded-lg border border-dashed bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
          This table is read-only here. Creating or editing catalog tests requires an
          administrator (or superuser); use <strong>Laboratory → Test catalog</strong> when you
          have that access.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading catalog…</div>
        ) : isError ? (
          <p className="p-4 text-destructive">Could not load tests.</p>
        ) : (
          <OverflowTable
            results={data?.results ?? []}
            total={data?.count ?? 0}
            catalogAdmin={catalogAdmin}
          />
        )}
      </div>
    </div>
  );
}

function OverflowTable({
  results,
  total,
  catalogAdmin,
}: {
  catalogAdmin: boolean;
  results: {
    id: string;
    test_code: string;
    test_name: string;
    unit: string;
    price: string;
    is_active: boolean;
  }[];
  total: number;
}) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Test</th>
              <th className="px-4 py-3 font-medium">Unit</th>
              <th className="px-4 py-3 font-medium">Price (ETB)</th>
            </tr>
          </thead>
          <tbody>
            {results.slice(0, LIMS_EXTENSION_PAGE_SIZE).map((t) => (
              <tr key={t.id} className="border-b border-border">
                <td className="px-4 py-3 font-mono text-xs">{t.test_code}</td>
                <td className="px-4 py-3">{t.test_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.unit}</td>
                <td className="px-4 py-3 tabular-nums">{t.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > LIMS_EXTENSION_PAGE_SIZE ? (
        <p className="border-t px-4 py-2 text-xs text-muted-foreground">
          Showing {Math.min(LIMS_EXTENSION_PAGE_SIZE, results.length)} of {total} active tests.
          {catalogAdmin
            ? "Full CRUD remains under Laboratory → Catalog."
            : "Edits are not available for your role."}
        </p>
      ) : null}
    </>
  );
}
