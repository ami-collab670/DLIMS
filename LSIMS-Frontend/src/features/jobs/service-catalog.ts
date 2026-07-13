/**
 * Client-facing service catalog utilities.
 * Data is loaded from GET /api/laboratory/tests/; job orders store a text summary.
 */

import type { DepartmentRecord } from "@/types/account-admin";
import type { TestCatalogItem } from "@/types/laboratory";

export const GENERAL_SERVICES_LABEL = "General services";

export type ClientCatalogTest = TestCatalogItem & {
  departmentName: string;
  priceNumber: number;
};

export type ClientCatalogGroup = {
  departmentId: string | null;
  departmentName: string;
  tests: ClientCatalogTest[];
};

export type ClientCatalogIndex = Map<string, ClientCatalogTest>;

export type DepartmentFilter = "all" | string;

function toClientCatalogTest(
  test: TestCatalogItem,
  departmentName: string,
): ClientCatalogTest {
  return {
    ...test,
    departmentName,
    priceNumber: Number(test.price) || 0,
  };
}

export function buildClientCatalog(
  tests: TestCatalogItem[],
  departments: DepartmentRecord[],
): { groups: ClientCatalogGroup[]; index: ClientCatalogIndex } {
  const deptNameById = new Map(departments.map((d) => [d.id, d.name]));
  const index: ClientCatalogIndex = new Map();

  const bucket = new Map<string | null, ClientCatalogTest[]>();

  for (const test of tests) {
    const departmentName = test.department
      ? (deptNameById.get(test.department) ?? GENERAL_SERVICES_LABEL)
      : GENERAL_SERVICES_LABEL;
    const entry = toClientCatalogTest(test, departmentName);
    index.set(test.id, entry);

    const key = test.department;
    const list = bucket.get(key) ?? [];
    list.push(entry);
    bucket.set(key, list);
  }

  const groups: ClientCatalogGroup[] = [];

  for (const dept of departments) {
    const deptTests = bucket.get(dept.id);
    if (!deptTests?.length) continue;
    deptTests.sort((a, b) => a.test_code.localeCompare(b.test_code));
    groups.push({
      departmentId: dept.id,
      departmentName: dept.name,
      tests: deptTests,
    });
  }

  const unassigned = bucket.get(null) ?? [];
  if (unassigned.length) {
    unassigned.sort((a, b) => a.test_code.localeCompare(b.test_code));
    groups.push({
      departmentId: null,
      departmentName: GENERAL_SERVICES_LABEL,
      tests: unassigned,
    });
  }

  for (const [deptId, deptTests] of bucket) {
    if (deptId == null || deptNameById.has(deptId)) continue;
    deptTests.sort((a, b) => a.test_code.localeCompare(b.test_code));
    groups.push({
      departmentId: deptId,
      departmentName: GENERAL_SERVICES_LABEL,
      tests: deptTests,
    });
  }

  groups.sort((a, b) => a.departmentName.localeCompare(b.departmentName));

  return { groups, index };
}

function matchesQuery(test: ClientCatalogTest, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    test.test_name.toLowerCase().includes(q) ||
    test.test_code.toLowerCase().includes(q) ||
    test.description.toLowerCase().includes(q) ||
    test.unit.toLowerCase().includes(q) ||
    test.departmentName.toLowerCase().includes(q)
  );
}

export function filterClientCatalog(
  groups: ClientCatalogGroup[],
  query: string,
  departmentId: DepartmentFilter,
): ClientCatalogGroup[] {
  return groups
    .filter((g) => {
      if (departmentId === "all") return true;
      if (departmentId === "general") return g.departmentId == null;
      return g.departmentId === departmentId;
    })
    .map((g) => ({
      ...g,
      tests: g.tests.filter((t) => matchesQuery(t, query)),
    }))
    .filter((g) => g.tests.length > 0);
}

export function lookupTestPrice(
  id: string,
  index: ClientCatalogIndex,
): number {
  return index.get(id)?.priceNumber ?? 0;
}

export function sumSelectedPrices(
  ids: Iterable<string>,
  index: ClientCatalogIndex,
): number {
  let total = 0;
  for (const id of ids) {
    total += lookupTestPrice(id, index);
  }
  return total;
}

export function formatCatalogLine(test: ClientCatalogTest): string {
  const unitSuffix = test.unit ? ` (${test.unit})` : "";
  return `- [${test.test_code} · ${test.departmentName}] ${test.test_name} — ${test.priceNumber.toFixed(2)} ETB${unitSuffix}`;
}

export function getDepartmentFilterOptions(
  groups: ClientCatalogGroup[],
): { id: DepartmentFilter; label: string }[] {
  const options: { id: DepartmentFilter; label: string }[] = [
    { id: "all", label: "All" },
  ];
  for (const g of groups) {
    options.push({
      id: g.departmentId ?? "general",
      label: g.departmentName,
    });
  }
  return options;
}
