import type { ReactNode } from "react";

import { SortableTableHead as GenericSortableTableHead } from "@/components/data-table/sortable-table-head";

import type { JobOrderSortKey, JobOrderSortState } from "./job-order-list-sort";

type SortableJobTableHeadProps = {
  label: ReactNode;
  sortKey: JobOrderSortKey;
  sort: JobOrderSortState;
  onSort: (key: JobOrderSortKey) => void;
  className?: string;
};

export function SortableJobTableHead(props: SortableJobTableHeadProps) {
  return <GenericSortableTableHead {...props} />;
}
